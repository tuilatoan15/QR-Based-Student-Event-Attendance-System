const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sql, poolPromise } = require('../config/db');

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;
const SALT_ROUNDS = 10;

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role_name
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const register = async (req, res, next) => {
  try {
    const { full_name, email, password, student_code } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email, password are required' });
    }

    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const roleResult = await pool
      .request()
      .input('name', sql.NVarChar(50), 'student')
      .query('SELECT id FROM roles WHERE name = @name');

    if (roleResult.recordset.length === 0) {
      return res.status(500).json({ message: 'Default student role not configured' });
    }

    const roleId = roleResult.recordset[0].id;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const insertUserResult = await pool
      .request()
      .input('full_name', sql.NVarChar(255), full_name)
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.NVarChar(255), passwordHash)
      .input('student_code', sql.NVarChar(50), student_code || null)
      .input('role_id', sql.Int, roleId)
      .query(
        `INSERT INTO users (full_name, email, password_hash, student_code, role_id, is_active, created_at, updated_at)
         VALUES (@full_name, @email, @password_hash, @student_code, @role_id, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
         SELECT SCOPE_IDENTITY() AS id;`
      );

    const userId = insertUserResult.recordset[0].id;

    const user = {
      id: userId,
      email,
      role_name: 'student'
    };

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const refreshExpires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await pool
      .request()
      .input('user_id', sql.Int, userId)
      .input('token', sql.NVarChar(512), refreshToken)
      .input('expires_at', sql.DateTime2, refreshExpires)
      .query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, is_revoked)
         VALUES (@user_id, @token, @expires_at, SYSUTCDATETIME(), 0);`
      );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        full_name,
        email,
        role: 'student'
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const pool = await poolPromise;

    const userResult = await pool
      .request()
      .input('email', sql.NVarChar(255), email)
      .query(
        `SELECT u.*, r.name AS role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.email = @email AND u.is_active = 1`
      );

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.recordset[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role_name: user.role_name
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken();
    const refreshExpires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await pool
      .request()
      .input('user_id', sql.Int, user.id)
      .input('token', sql.NVarChar(512), refreshToken)
      .input('expires_at', sql.DateTime2, refreshExpires)
      .query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, is_revoked)
         VALUES (@user_id, @token, @expires_at, SYSUTCDATETIME(), 0);`
      );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const pool = await poolPromise;

    const tokenResult = await pool
      .request()
      .input('token', sql.NVarChar(512), refreshToken)
      .query(
        `SELECT rt.*, u.email, u.is_active, r.name AS role_name
         FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE rt.token = @token AND rt.is_revoked = 0`
      );

    if (tokenResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const row = tokenResult.recordset[0];

    if (!row.is_active) {
      return res.status(401).json({ message: 'User is inactive' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    await pool
      .request()
      .input('id', sql.Int, row.id)
      .query('UPDATE refresh_tokens SET is_revoked = 1 WHERE id = @id');

    const userPayload = {
      id: row.user_id,
      email: row.email,
      role_name: row.role_name
    };

    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken();
    const refreshExpires = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await pool
      .request()
      .input('user_id', sql.Int, row.user_id)
      .input('token', sql.NVarChar(512), newRefreshToken)
      .input('expires_at', sql.DateTime2, refreshExpires)
      .query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at, is_revoked)
         VALUES (@user_id, @token, @expires_at, SYSUTCDATETIME(), 0);`
      );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const pool = await poolPromise;

    await pool
      .request()
      .input('token', sql.NVarChar(512), refreshToken)
      .query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token = @token');

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout
};

