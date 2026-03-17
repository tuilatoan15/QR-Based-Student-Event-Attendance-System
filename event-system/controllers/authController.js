const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { createUser, findUserByEmail, getRoleIdByName } = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logAuthAttempt } = require('../utils/logger');

dotenv.config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_name || user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
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
      student_code: student_code || null
    });

    const userWithRole = { ...newUser, role_name: 'student' };
    const token = generateToken(userWithRole);

    return successResponse(res, 201, 'User registered successfully', {
      user: {
        id: newUser.id,
        full_name,
        email,
        student_code: newUser.student_code || student_code,
        role: 'student'
      },
      token
    });
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
    console.log('Login attempt:', { email, password, userFound: !!user, passwordHash: user?.password_hash, match });
    if (!match) {
      logAuthAttempt(email, false);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Mobile app: block admin role only, allow organizer
    const client = (req.headers['x-client'] || '').toString().toLowerCase();
    const roleName = (user.role_name || '').toLowerCase();
    if (client === 'mobile-app' && roleName === 'admin') {
      logAuthAttempt(email, false);
      return errorResponse(
        res,
        403,
        'Admin must use the web admin dashboard.',
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
        avatar: user.avatar || null
      },
      token
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login
};
