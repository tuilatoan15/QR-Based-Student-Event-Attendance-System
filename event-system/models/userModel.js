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

const listUsers = async ({ offset = 0, limit = 50, search = '' } = {}) => {
  const pool = await poolPromise;
  const term = (search || '').trim();

  const request = pool
    .request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  let whereSql = '';
  if (term) {
    request.input('search', sql.NVarChar(255), `%${term}%`);
    whereSql = 'WHERE (u.full_name LIKE @search OR u.email LIKE @search OR u.student_code LIKE @search)';
  }

  const result = await request.query(
    `SELECT u.id, u.full_name, u.email, u.student_code, u.is_active, u.created_at, u.updated_at,
            r.name AS role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ${whereSql}
     ORDER BY u.created_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
  );
  return result.recordset;
};

const countUsers = async ({ search = '' } = {}) => {
  const pool = await poolPromise;
  const term = (search || '').trim();
  const request = pool.request();
  let whereSql = '';
  if (term) {
    request.input('search', sql.NVarChar(255), `%${term}%`);
    whereSql = 'WHERE (full_name LIKE @search OR email LIKE @search OR student_code LIKE @search)';
  }

  const result = await request.query(
    `SELECT COUNT(1) AS total
     FROM users
     ${whereSql}`
  );
  return result.recordset[0]?.total ?? 0;
};

const setUserRoleByName = async (userId, roleName) => {
  const pool = await poolPromise;
  const roleId = await getRoleIdByName(roleName);
  if (!roleId) return false;

  await pool
    .request()
    .input('id', sql.Int, userId)
    .input('role_id', sql.Int, roleId)
    .query('UPDATE users SET role_id = @role_id, updated_at = SYSUTCDATETIME() WHERE id = @id');
  return true;
};

const setUserActive = async (userId, isActive) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('id', sql.Int, userId)
    .input('is_active', sql.Bit, isActive ? 1 : 0)
    .query('UPDATE users SET is_active = @is_active, updated_at = SYSUTCDATETIME() WHERE id = @id');
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getRoleIdByName,
  listUsers,
  countUsers,
  setUserRoleByName,
  setUserActive
};
