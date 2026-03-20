const { sql, poolPromise } = require('../config/db');

const createEvent = async ({
  title,
  description,
  location,
  start_time,
  end_time,
  max_participants,
  category_id,
  created_by,
  google_sheet_id = null,
  google_sheet_name = null
}) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('title', sql.NVarChar(255), title)
    .input('description', sql.NVarChar(sql.MAX), description || null)
    .input('location', sql.NVarChar(255), location)
    .input('start_time', sql.DateTime2, new Date(start_time))
    .input('end_time', sql.DateTime2, new Date(end_time))
    .input('max_participants', sql.Int, max_participants)
    .input('category_id', sql.Int, category_id || null)
    .input('created_by', sql.Int, created_by)
    .input('google_sheet_id', sql.NVarChar(255), google_sheet_id)
    .input('google_sheet_name', sql.NVarChar(255), google_sheet_name)
    .query(
      `INSERT INTO events (title, description, location, start_time, end_time, max_participants, category_id, created_by, google_sheet_id, google_sheet_name, is_active, created_at)
       VALUES (@title, @description, @location, @start_time, @end_time, @max_participants, @category_id, @created_by, @google_sheet_id, @google_sheet_name, 1, SYSUTCDATETIME());
       SELECT SCOPE_IDENTITY() AS id;`
    );
  return result.recordset[0].id;
};

const getAllEvents = async (offset = 0, limit = 10) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(
      `SELECT e.*, c.name AS category_name
       FROM events e
       LEFT JOIN event_categories c ON e.category_id = c.id
       WHERE e.is_active = 1
       ORDER BY 
         CASE WHEN e.end_time >= SYSUTCDATETIME() THEN 0 ELSE 1 END,
         e.start_time ASC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );
  return result.recordset;
};

const getEventById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(
      `SELECT e.*, c.name AS category_name
       FROM events e
       LEFT JOIN event_categories c ON e.category_id = c.id
       WHERE e.id = @id`
    );
  return result.recordset[0] || null;
};

const updateEvent = async (id, fields) => {
  const pool = await poolPromise;
  const req = pool.request().input('id', sql.Int, id);
  if (fields.title != null) req.input('title', sql.NVarChar(255), fields.title);
  if (fields.description != null) req.input('description', sql.NVarChar(sql.MAX), fields.description);
  if (fields.location != null) req.input('location', sql.NVarChar(255), fields.location);
  if (fields.start_time != null) req.input('start_time', sql.DateTime2, new Date(fields.start_time));
  if (fields.end_time != null) req.input('end_time', sql.DateTime2, new Date(fields.end_time));
  if (fields.max_participants != null) req.input('max_participants', sql.Int, fields.max_participants);
  if (fields.category_id != null) req.input('category_id', sql.Int, fields.category_id);
  if (fields.google_sheet_id != null) req.input('google_sheet_id', sql.NVarChar(255), fields.google_sheet_id);
  if (fields.google_sheet_name != null) req.input('google_sheet_name', sql.NVarChar(255), fields.google_sheet_name);
  if (fields.is_active !== undefined) req.input('is_active', sql.Bit, fields.is_active ? 1 : 0);
  const updates = [];
  if (fields.title != null) updates.push('title = @title');
  if (fields.description != null) updates.push('description = @description');
  if (fields.location != null) updates.push('location = @location');
  if (fields.start_time != null) updates.push('start_time = @start_time');
  if (fields.end_time != null) updates.push('end_time = @end_time');
  if (fields.max_participants != null) updates.push('max_participants = @max_participants');
  if (fields.category_id != null) updates.push('category_id = @category_id');
  if (fields.google_sheet_id != null) updates.push('google_sheet_id = @google_sheet_id');
  if (fields.google_sheet_name != null) updates.push('google_sheet_name = @google_sheet_name');
  if (fields.is_active !== undefined) updates.push('is_active = @is_active');
  if (updates.length === 0) return;
  await req.query(`UPDATE events SET ${updates.join(', ')} WHERE id = @id`);
};

const softDeleteEvent = async (id) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('id', sql.Int, id)
    .query('UPDATE events SET is_active = 0 WHERE id = @id');
};

const getEventsByOrganizer = async (created_by, offset = 0, limit = 10) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('created_by', sql.Int, created_by)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(
      `SELECT e.*, c.name AS category_name
       FROM events e
       LEFT JOIN event_categories c ON e.category_id = c.id
       WHERE e.created_by = @created_by AND e.is_active = 1
       ORDER BY 
         CASE WHEN e.end_time >= SYSUTCDATETIME() THEN 0 ELSE 1 END,
         e.start_time ASC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );
  return result.recordset;
};

const getEventParticipants = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query(
      `SELECT
        r.id AS registration_id,
        r.user_id,
        u.full_name AS student_name,
        u.student_code,
        u.email,
        r.status AS registration_status,
        a.checkin_time
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN attendances a ON a.registration_id = r.id
       WHERE r.event_id = @event_id
       ORDER BY r.registered_at ASC`
    );
  return result.recordset;
};

const countRegistrationsForEvent = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query('SELECT COUNT(*) as count FROM registrations WHERE event_id = @event_id');
  return result.recordset[0].count;
};

const countAllEvents = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query('SELECT COUNT(*) as total FROM events WHERE is_active = 1');
  return result.recordset[0].total;
};

const countEventsByOrganizer = async (created_by) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('created_by', sql.Int, created_by)
    .query('SELECT COUNT(*) as total FROM events WHERE created_by = @created_by AND is_active = 1');
  return result.recordset[0].total;
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  getEventsByOrganizer,
  getEventParticipants,
  updateEvent,
  softDeleteEvent,
  countRegistrationsForEvent,
  countAllEvents,
  countEventsByOrganizer
};
