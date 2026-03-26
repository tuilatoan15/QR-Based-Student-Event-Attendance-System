const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const {
  createUser,
  findUserByEmail,
  getRoleIdByName,
  getOrganizerInfoByUserId,
  createOrganizerInfo,
  updateUserPassword,
} = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logAuthAttempt } = require('../utils/logger');

dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const MAIL_USER = process.env.MAIL_USER || '';
const MAIL_PASS = process.env.MAIL_PASS || '';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_name || user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const generateRandomPassword = (length = 12) => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const register = async (req, res, next) => {
  try {
    const { full_name, email, password, student_code } = req.body;

    if (!full_name || !email || !password) {
      return errorResponse(res, 400, 'full_name, email and password are required');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return errorResponse(res, 409, 'Email already registered');
    }

    const roleId = await getRoleIdByName('student');
    if (!roleId) {
      return errorResponse(res, 500, 'Default student role not configured');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await createUser({
      full_name,
      email,
      password_hash,
      role_id: roleId,
      student_code: student_code || null,
    });

    const userWithRole = { ...newUser, role_name: 'student' };
    const token = generateToken(userWithRole);

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        id: newUser.id,
        full_name,
        email,
        student_code: newUser.student_code || student_code,
        role: 'student',
      },
      token,
    });
  } catch (err) {
    next(err);
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

    if (!full_name || !email || !password || !organization_name) {
      return errorResponse(
        res,
        400,
        'full_name, email, password, and organization_name are required'
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      const orgInfo = await getOrganizerInfoByUserId(existing.id);
      if (orgInfo) {
        return errorResponse(
          res,
          409,
          'User is already registered as an organizer'
        );
      }
      return errorResponse(res, 409, 'Email already registered');
    }

    const roleId = await getRoleIdByName('student');
    if (!roleId) {
      return errorResponse(res, 500, 'Default student role not configured');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await createUser({
      full_name,
      email,
      password_hash,
      role_id: roleId,
      student_code: null,
    });

    await createOrganizerInfo({
      user_id: newUser.id,
      organization_name,
      position,
      phone,
      bio,
      website,
    });

    return successResponse(
      res,
      201,
      'Dang ky thanh cong, vui long cho admin duyet tai khoan'
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'email and password are required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      logAuthAttempt(email, false);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (!user.is_active) {
      logAuthAttempt(email, false);
      return errorResponse(res, 401, 'Account is inactive');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      logAuthAttempt(email, false);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const orgInfo = await getOrganizerInfoByUserId(user.id);
    if (orgInfo) {
      if (orgInfo.approval_status === 'pending') {
        logAuthAttempt(email, false);
        return errorResponse(
          res,
          403,
          'Tai khoan cua ban chua duoc Admin phe duyet'
        );
      }
      if (orgInfo.approval_status === 'rejected') {
        logAuthAttempt(email, false);
        return errorResponse(
          res,
          403,
          `Tai khoan da bi tu choi: ${orgInfo.reject_reason || ''}`
        );
      }
    }

    const client = (req.headers['x-client'] || '').toString().toLowerCase();
    const roleName = (user.role_name || '').toLowerCase();
    if (client === 'mobile-app' && roleName === 'admin') {
      logAuthAttempt(email, false);
      return errorResponse(
        res,
        403,
        'Admin must use the web admin dashboard.'
      );
    }

    logAuthAttempt(email, true);
    const token = generateToken(user);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        student_code: user.student_code,
        role: user.role_name,
        avatar: user.avatar || null,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'email is required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse(res, 404, 'Email chua duoc dang ky');
    }

    const newPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await updateUserPassword(user.id, passwordHash);

    if (!MAIL_USER || !MAIL_PASS) {
      return errorResponse(
        res,
        500,
        'Chua cau hinh MAIL_USER va MAIL_PASS trong file .env'
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"EventPass Support" <${MAIL_USER}>`,
      to: email,
      subject: 'Cap lai mat khau EventPass',
      text:
        `Xin chao ${user.full_name},\n\n` +
        `Mat khau moi cua ban la: ${newPassword}\n\n` +
        'Vui long dang nhap lai va doi mat khau sau khi vao he thong.',
    });

    return successResponse(
      res,
      200,
      'Mat khau moi da duoc gui ve email dang ky'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  registerOrganizer,
  login,
  forgotPassword,
};
