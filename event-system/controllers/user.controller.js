const { sql, poolPromise } = require('../config/db');

const getAllUsers = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT u.id, u.full_name, u.email, u.student_code, u.is_active,
                u.created_at, u.updated_at, r.name AS role
         FROM users u
         JOIN roles r ON u.role_id = r.id`
      );

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(
        `SELECT u.id, u.full_name, u.email, u.student_code, u.is_active,
                u.created_at, u.updated_at, r.name AS role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = @id`
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { full_name, student_code, is_active, role_id } = req.body;
    const userId = req.params.id;

    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input('id', sql.Int, userId)
      .query('SELECT id FROM users WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool
      .request()
      .input('id', sql.Int, userId)
      .input('full_name', sql.NVarChar(255), full_name || null)
      .input('student_code', sql.NVarChar(50), student_code || null)
      .input('is_active', sql.Bit, typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null)
      .input('role_id', sql.Int, role_id || null)
      .query(
        `UPDATE users
         SET
           full_name = COALESCE(@full_name, full_name),
           student_code = COALESCE(@student_code, student_code),
           is_active = COALESCE(@is_active, is_active),
           role_id = COALESCE(@role_id, role_id),
           updated_at = SYSUTCDATETIME()
         WHERE id = @id`
      );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteUserSoft = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input('id', sql.Int, userId)
      .query('SELECT id FROM users WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool
      .request()
      .input('id', sql.Int, userId)
      .query(
        `UPDATE users
         SET is_active = 0,
             updated_at = SYSUTCDATETIME()
         WHERE id = @id`
      );

    res.json({ message: 'User soft-deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUserSoft
};

