const { sql, poolPromise } = require('../config/db');

const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  ATTENDED: 'attended',
  CANCELLED: 'cancelled'
};

const createRegistration = async ({ user_id, event_id, qr_token }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .input('event_id', sql.Int, event_id)
    .input('qr_token', sql.NVarChar(255), qr_token)
    .input('status', sql.NVarChar(20), REGISTRATION_STATUS.REGISTERED)
    .query(
      `INSERT INTO registrations (user_id, event_id, qr_token, status, registered_at)
       VALUES (@user_id, @event_id, @qr_token, @status, SYSUTCDATETIME());
       SELECT SCOPE_IDENTITY() AS id;`
    );
  return { id: result.recordset[0].id, user_id, event_id, qr_token, status: REGISTRATION_STATUS.REGISTERED };
};

const findRegistrationByUserAndEvent = async (user_id, event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .input('event_id', sql.Int, event_id)
    .query('SELECT * FROM registrations WHERE user_id = @user_id AND event_id = @event_id');
  return result.recordset[0] || null;
};

const findRegistrationByQrToken = async (qr_token) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('qr_token', sql.NVarChar(255), qr_token)
    .query(
      `SELECT r.*, u.full_name, u.email, e.title AS event_title, e.is_active AS event_is_active
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.qr_token = @qr_token`
    );
  return result.recordset[0] || null;
};

const getRegistrationById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(
      `SELECT r.*, u.full_name, u.email, u.student_code
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = @id`
    );
  return result.recordset[0] || null;
};

const updateRegistrationStatus = async (id, status) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(20), status)
    .query('UPDATE registrations SET status = @status WHERE id = @id');
};

const getRegistrationsByUserWithEvents = async (user_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .query(
      `SELECT 
              e.id, e.title, e.location, e.start_time, e.end_time, e.description, e.max_participants,
              r.id AS registration_id, r.user_id, r.qr_token, r.status, r.registered_at
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = @user_id AND r.status != 'cancelled'
       ORDER BY e.start_time ASC`
    );
  
  // Group by event and add registration
  const eventsMap = {};
  result.recordset.forEach(row => {
    const eventId = row.id;
    if (!eventsMap[eventId]) {
      eventsMap[eventId] = {
        id: row.id,
        title: row.title,
        location: row.location,
        start_time: row.start_time,
        end_time: row.end_time,
        description: row.description,
        max_participants: row.max_participants,
        registration: {
          id: row.registration_id,
          user_id: row.user_id,
          qr_token: row.qr_token,
          status: row.status,
          registered_at: row.registered_at
        }
      };
    }
  });
  
  return Object.values(eventsMap);
};

const getRegistrationsForEvent = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query(
      `SELECT r.*, u.full_name, u.email, u.student_code
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = @event_id`
    );
  return result.recordset;
};

const getAttendancesForEvent = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query(
      `SELECT a.id, a.registration_id, a.checkin_time, a.checkin_by,
              r.user_id, r.event_id, r.qr_token, r.status AS registration_status,
              u.full_name AS student_name, u.email, u.student_code,
              e.title AS event_title
       FROM attendances a
       JOIN registrations r ON a.registration_id = r.id
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.event_id = @event_id
       ORDER BY a.checkin_time ASC`
    );
  return result.recordset;
};

const insertAttendance = async (registration_id, checkin_by) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('registration_id', sql.Int, registration_id)
    .input('checkin_by', sql.Int, checkin_by)
    .query(
      `INSERT INTO attendances (registration_id, checkin_time, checkin_by)
       OUTPUT INSERTED.checkin_time AS checkin_time
       VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by)`
    );
  return result.recordset[0].checkin_time;
};

const hasAttendanceForRegistration = async (registration_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('registration_id', sql.Int, registration_id)
    .query('SELECT id FROM attendances WHERE registration_id = @registration_id');
  return result.recordset.length > 0;
};

module.exports = {
  REGISTRATION_STATUS,
  createRegistration,
  findRegistrationByUserAndEvent,
  findRegistrationByQrToken,
  getRegistrationById,
  updateRegistrationStatus,
  getRegistrationsByUserWithEvents,
  getRegistrationsForEvent,
  getAttendancesForEvent,
  insertAttendance,
  hasAttendanceForRegistration
};
