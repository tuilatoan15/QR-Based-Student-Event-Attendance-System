const { sql, poolPromise } = require('../config/db');

const createUser = async ({ full_name, email, password_hash, role_id, student_code }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('full_name', sql.NVarChar(255), full_name)
    .input('email', sql.NVarChar(255), email)
    .input('password_hash', sql.NVarChar(255), password_hash)
    .input('role_id', sql.Int, role_id)
    .input('student_code', sql.NVarChar(50), student_code || null)
    .query(
      `INSERT INTO users (full_name, email, password_hash, student_code, role_id, is_active, created_at, updated_at)
       VALUES (@full_name, @email, @password_hash, @student_code, @role_id, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
       SELECT SCOPE_IDENTITY() AS id;`
    );
  const id = result.recordset[0].id;
  return { id, full_name, email, role_id };
};

const findUserByEmail = async (email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), email)
    .query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = @email`
    );
  return result.recordset[0] || null;
};

const findUserById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = @id`
    );
  return result.recordset[0] || null;
};

const getRoleIdByName = async (name) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('name', sql.NVarChar(50), name)
    .query('SELECT id FROM roles WHERE name = @name');
  return result.recordset[0] ? result.recordset[0].id : null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getRoleIdByName
};
