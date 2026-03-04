const { sql, poolPromise } = require('../config/db');

const createUser = async ({ name, email, password, role = 'student' }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('name', sql.NVarChar(255), name)
    .input('email', sql.NVarChar(255), email)
    .input('password', sql.NVarChar(255), password)
    .input('role', sql.NVarChar(20), role)
    .query(
      `INSERT INTO users (name, email, password, role)
       VALUES (@name, @email, @password, @role);
       SELECT SCOPE_IDENTITY() AS id;`
    );

  const insertedId = result.recordset[0].id;
  return { id: insertedId, name, email, role };
};

const findUserByEmail = async (email) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), email)
    .query('SELECT * FROM users WHERE email = @email;');

  return result.recordset[0] || null;
};

const findUserById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM users WHERE id = @id;');

  return result.recordset[0] || null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};

