const { sql, poolPromise } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT id, title, message, is_read, created_at 
        FROM notifications 
        WHERE user_id = @user_id 
        ORDER BY created_at DESC
      `);

    return successResponse(res, 200, 'Notifications retrieved successfully', result.recordset);
  } catch (err) {
    next(err);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('notif_id', sql.Int, notifId)
      .query(`
        UPDATE notifications 
        SET is_read = 1 
        WHERE id = @notif_id AND user_id = @user_id
      `);

    return successResponse(res, 200, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

const cloudinary = require('../config/cloudinary');

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded');
    }

    const userId = req.user.id;
    
    // Convert buffer to Base64 to upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'avatars',
      resource_type: 'image'
    });

    const avatarUrl = result.secure_url;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('avatar', sql.NVarChar(sql.MAX), avatarUrl)
      .query('UPDATE users SET avatar = @avatar, updated_at = SYSUTCDATETIME() WHERE id = @user_id');

    return successResponse(res, 200, 'Avatar updated successfully', { avatar: avatarUrl });
  } catch (err) {
    console.error('Avatar update error:', err);
    next(err);
  }
};

const bcrypt = require('bcrypt');
const { findUserById, updateUserPassword } = require('../models/userModel');

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return errorResponse(res, 400, 'Mật khẩu cũ và mới là bắt buộc (old_password, new_password)');
    }

    if (new_password.length < 6) {
      return errorResponse(res, 400, 'Mật khẩu mới phải từ 6 ký tự trở lên');
    }

    const user = await findUserById(userId);
    if (!user) {
      return errorResponse(res, 404, 'Không tìm thấy người dùng');
    }

    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) {
      return errorResponse(res, 400, 'Mật khẩu cũ không chính xác');
    }

    const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    await updateUserPassword(userId, newPasswordHash);

    return successResponse(res, 200, 'Đổi mật khẩu thành công');
  } catch (err) {
    next(err);
  }
};

const getOrganizerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT u.id, u.full_name, u.email, u.avatar,
               o.organization_name, o.position, o.phone, o.bio, o.website,
               o.approval_status
        FROM users u
        LEFT JOIN organizer_info o ON u.id = o.user_id
        WHERE u.id = @user_id
      `);
      
    if (!result.recordset[0]) {
      return errorResponse(res, 404, 'User not found');
    }
    
    return successResponse(res, 200, 'Organizer profile retrieved successfully', result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

const updateOrganizerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, organization_name, position, phone, bio, website } = req.body;
    
    const pool = await poolPromise;
    
    if (full_name) {
      await pool.request()
        .input('user_id', sql.Int, userId)
        .input('full_name', sql.NVarChar(255), full_name)
        .query('UPDATE users SET full_name = @full_name, updated_at = SYSUTCDATETIME() WHERE id = @user_id');
    }

    if (organization_name !== undefined || position !== undefined || phone !== undefined || bio !== undefined || website !== undefined) {
      // Ensure organizer_info exists
      const checkOrg = await pool.request()
        .input('check_uid', sql.Int, userId)
        .query('SELECT id FROM organizer_info WHERE user_id = @check_uid');
      if (checkOrg.recordset.length === 0) {
        await pool.request()
          .input('new_uid', sql.Int, userId)
          .query("INSERT INTO organizer_info (user_id, approval_status, created_at, updated_at) VALUES (@new_uid, 'approved', GETDATE(), GETDATE())");
      }

      const request = pool.request().input('user_id', sql.Int, userId);
      const updates = [];
      if (organization_name !== undefined) { updates.push('organization_name = @org_name'); request.input('org_name', sql.NVarChar(255), organization_name); }
      if (position !== undefined) { updates.push('position = @pos'); request.input('pos', sql.NVarChar(255), position); }
      if (phone !== undefined) { updates.push('phone = @phone'); request.input('phone', sql.VarChar(20), phone); }
      if (bio !== undefined) { updates.push('bio = @bio'); request.input('bio', sql.NVarChar(sql.MAX), bio); }
      if (website !== undefined) { updates.push('website = @web'); request.input('web', sql.NVarChar(255), website); }
      
      if (updates.length > 0) {
        updates.push('updated_at = GETDATE()');
        await request.query(`UPDATE organizer_info SET ${updates.join(', ')} WHERE user_id = @user_id`);
      }
    }
    
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT u.id, u.full_name, u.email, u.avatar,
               o.organization_name, o.position, o.phone, o.bio, o.website,
               o.approval_status
        FROM users u
        LEFT JOIN organizer_info o ON u.id = o.user_id
        WHERE u.id = @user_id
      `);

    return successResponse(res, 200, 'Cập nhật thành công', result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  updateAvatar,
  changePassword,
  getOrganizerProfile,
  updateOrganizerProfile
};
