const { sql, poolPromise } = require('../config/db');

const createEventMember = async ({ event_id, student_id, student_name, email, qr_code }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .input('student_id', sql.NVarChar(50), student_id)
    .input('student_name', sql.NVarChar(255), student_name)
    .input('email', sql.NVarChar(255), email)
    .input('qr_code', sql.NVarChar(255), qr_code)
    .query(
      `INSERT INTO event_members (event_id, student_id, student_name, email, qr_code)
       VALUES (@event_id, @student_id, @student_name, @email, @qr_code);
       SELECT SCOPE_IDENTITY() AS id;`
    );
  return result.recordset[0].id;
};

const findEventMemberByQrCode = async (qr_code) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('qr_code', sql.NVarChar(255), qr_code)
    .query('SELECT * FROM event_members WHERE qr_code = @qr_code');
  return result.recordset[0] || null;
};

const updateAttendanceStatus = async (id, attendance_status, checkin_time) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('attendance_status', sql.Bit, attendance_status)
    .input('checkin_time', sql.DateTime2, checkin_time)
    .query('UPDATE event_members SET attendance_status = @attendance_status, checkin_time = @checkin_time WHERE id = @id');
};

const getEventMembers = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query('SELECT * FROM event_members WHERE event_id = @event_id ORDER BY created_at');
  return result.recordset;
};

module.exports = {
  createEventMember,
  findEventMemberByQrCode,
  updateAttendanceStatus,
  getEventMembers
};