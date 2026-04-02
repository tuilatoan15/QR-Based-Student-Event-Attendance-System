const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logAuthAttempt } = require('../utils/logger');
const { nextLegacySqlId } = require('../utils/legacySequence');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const { getPublicId } = require('../utils/clientFormat');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const buildToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const serializeUser = (user) => ({
  id: user.legacy_sql_id ?? user._id.toString(),
  full_name: user.full_name,
  email: user.email,
  student_code: user.student_code,
  role: user.role,
  avatar: user.avatar || null,
  organizer_profile: user.organizer_profile || null,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

const syncOrganizerInfo = async (db, user, profile, options = {}) => {
  if (!db || !user) {
    return;
  }

  const {
    approval_status = 'pending',
    reject_reason = null,
    approved_by = null,
  } = options;

  await db.collection('organizer_infos').updateOne(
    { user_id: user._id },
    {
      $set: {
        full_name: user.full_name,
        email: user.email,
        organization_name: profile.organization_name || null,
        position: profile.position || null,
        phone: profile.phone || null,
        bio: profile.bio || null,
        website: profile.website || null,
        approval_status,
        reject_reason,
        approved_by,
        updated_at: new Date(),
      },
      $setOnInsert: {
        created_at: new Date(),
      },
    },
    { upsert: true }
  );
};

const register = async (req, res, next) => {
  try {
    const { full_name, email, password, student_code } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 409, 'Email đã được đăng ký');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const legacy_sql_id = await nextLegacySqlId(req.app.locals.db, 'users');
    const user = await User.create({
      legacy_sql_id,
      full_name,
      email: email.toLowerCase(),
      password_hash,
      student_code: student_code || null,
      role: 'student',
    });

    const token = buildToken(user);
    return successResponse(res, 201, 'Đăng ký người dùng thành công', {
      user: {
        ...serializeUser(user),
        id: getPublicId(user, req),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const registerOrganizer = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      organization_name,
      position,
      phone,
      bio,
      website,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 409, 'Email đã được đăng ký');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const legacy_sql_id = await nextLegacySqlId(req.app.locals.db, 'users');
    const organizerProfile = {
      organization_name,
      position,
      phone,
      bio,
      website,
    };

    const user = await User.create({
      legacy_sql_id,
      full_name,
      email: email.toLowerCase(),
      password_hash,
      role: 'organizer',
      organizer_profile: organizerProfile,
    });

    await syncOrganizerInfo(req.app?.locals?.db, user, organizerProfile);

    const token = buildToken(user);
    return successResponse(res, 201, 'Đăng ký nhà tổ chức thành công', {
      user: {
        ...serializeUser(user),
        id: getPublicId(user, req),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');
    if (!user) {
      logAuthAttempt(email, false);
      return errorResponse(res, 401, 'Thông tin đăng nhập không chính xác');
    }

    if (!user.is_active) {
      logAuthAttempt(email, false);
      return errorResponse(res, 403, 'Tài khoản đã bị tạm khóa');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      logAuthAttempt(email, false);
      return errorResponse(res, 401, 'Thông tin đăng nhập không chính xác');
    }

    if (user.role === 'organizer') {
      const organizerInfo = await req.app.locals.db.collection('organizer_infos').findOne({ user_id: user._id });
      if (!organizerInfo || organizerInfo.approval_status !== 'approved') {
        const status = organizerInfo?.approval_status || 'pending';
        logAuthAttempt(email, false);
        
        if (status === 'rejected' || status === 'tu choi' || status === 'từ chối') {
          return errorResponse(res, 403, 'Tài khoản đã bị từ chối phê duyệt. Lý do: ' + (organizerInfo?.reject_reason || 'Không có lý do cụ thể'));
        }
        
        return errorResponse(res, 403, 'Tài khoản đang chờ phê duyệt. Vui lòng quay lại sau.');
      }
    }

    logAuthAttempt(email, true);

    const token = buildToken(user);

    return successResponse(res, 200, 'Đăng nhập thành công', {
      user: {
        ...serializeUser(user),
        id: getPublicId(user, req),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 400, 'Yêu cầu cung cấp email');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Vì lý do bảo mật, không trả ra 404 cho email không tồn tại.
      // Chúng ta trả về thông báo thành công dù email có tồn tại hay không.
      return successResponse(
        res,
        200,
        'Nếu email tồn tại trong hệ thống, chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu vào đó'
      );
    }

    // Tạo mật khẩu tạm thời
    const temporaryPassword = crypto.randomBytes(4).toString('hex');
    const password_hash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    // Cập nhật người dùng
    user.password_hash = password_hash;
    await user.save();

    // Gửi email
    const message = `
      Xin chào ${user.full_name},

      Mật khẩu mới của bạn cho hệ thống EventPass đã được thay đổi thành: ${temporaryPassword}

      Vui lòng đăng nhập bằng mật khẩu này và đổi mật khẩu mới ngay sau khi đăng nhập thành công để đảm bảo an toàn.

      Trân trọng,
      Đội ngũ EventPass.
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #00CCFF;">EventPass - Thông báo thay đổi mật khẩu</h2>
        <p>Xin chào <strong>${user.full_name}</strong>,</p>
        <p>Mật khẩu mới của bạn cho hệ thống <strong>EventPass</strong> đã được thay đổi thành:</p>
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; font-size: 20px; text-align: center; font-weight: bold; margin: 20px 0;">
          ${temporaryPassword}
        </div>
        <p>Vui lòng đăng nhập bằng mật khẩu này và đổi mật khẩu mới ngay sau khi đăng nhập thành công để đảm bảo an toàn.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">Đây là email tự động, vui lòng không trả lời.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: '[EventPass] Mật khẩu mới được thiết lập',
        message,
        html,
      });
    } catch (err) {
      console.error('Email sending failed in forgotPassword:', err);
      // Nếu gửi email lỗi, vẫn nên thông báo thành công (người dùng không cần biết lỗi SMTP)
      // nhưng có thể log lỗi vào database.
    }

    return successResponse(
      res,
      200,
      'Mật khẩu mới đã được gửi vào địa chỉ email của bạn'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  forgotPassword,
  register,
  registerOrganizer,
  login,
};
