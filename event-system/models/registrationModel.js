const { sql, poolPromise } = require('../config/db');

const createRegistration = async ({ user_id, event_id, qr_code }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .input('event_id', sql.Int, event_id)
    .input('qr_code', sql.NVarChar(255), qr_code)
    .query(
      `INSERT INTO registrations (user_id, event_id, qr_code)
       VALUES (@user_id, @event_id, @qr_code);
       SELECT SCOPE_IDENTITY() AS id;`
    );

  const insertedId = result.recordset[0].id;
  return { id: insertedId, user_id, event_id, qr_code, status: 'registered' };
};

const findRegistrationByUserAndEvent = async (user_id, event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .input('event_id', sql.Int, event_id)
    .query(
      `SELECT *
       FROM registrations
       WHERE user_id = @user_id AND event_id = @event_id;`
    );

  return result.recordset[0] || null;
};

const findRegistrationByQRCode = async (qr_code) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('qr_code', sql.NVarChar(255), qr_code)
    .query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email,
              e.name AS event_name, e.location, e.time
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.qr_code = @qr_code;`
    );

  return result.recordset[0] || null;
};

const updateRegistrationStatus = async (id, status) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(20), status)
    .query(
      'UPDATE registrations SET status = @status WHERE id = @id;'
    );
};

const getRegistrationsByUserWithEvents = async (user_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .query(
      `SELECT r.id AS registration_id,
              r.qr_code,
              r.status,
              r.created_at AS registration_created_at,
              e.id AS event_id,
              e.name AS event_name,
              e.location,
              e.time,
              e.description
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = @user_id
       ORDER BY e.time ASC;`
    );

  return result.recordset;
};

module.exports = {
  createRegistration,
  findRegistrationByUserAndEvent,
  findRegistrationByQRCode,
  updateRegistrationStatus,
  getRegistrationsByUserWithEvents
};

