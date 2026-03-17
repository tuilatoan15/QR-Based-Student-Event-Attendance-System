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

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded');
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('avatar', sql.NVarChar(sql.MAX), avatarUrl)
      .query('UPDATE users SET avatar = @avatar, updated_at = SYSUTCDATETIME() WHERE id = @user_id');

    return successResponse(res, 200, 'Avatar updated successfully', { avatar: avatarUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  updateAvatar
};
