const { sql, poolPromise } = require('../config/db');

const createEvent = async ({
  title,
  description,
  location,
  start_time,
  end_time,
  max_participants,
  category_id,
  created_by
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
    .query(
      `INSERT INTO events (title, description, location, start_time, end_time, max_participants, category_id, created_by, is_active, created_at)
       VALUES (@title, @description, @location, @start_time, @end_time, @max_participants, @category_id, @created_by, 1, SYSUTCDATETIME());
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
       ORDER BY e.start_time ASC
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
  if (fields.is_active !== undefined) req.input('is_active', sql.Bit, fields.is_active ? 1 : 0);
  const updates = [];
  if (fields.title != null) updates.push('title = @title');
  if (fields.description != null) updates.push('description = @description');
  if (fields.location != null) updates.push('location = @location');
  if (fields.start_time != null) updates.push('start_time = @start_time');
  if (fields.end_time != null) updates.push('end_time = @end_time');
  if (fields.max_participants != null) updates.push('max_participants = @max_participants');
  if (fields.category_id != null) updates.push('category_id = @category_id');
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

const countRegistrationsForEvent = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query('SELECT COUNT(*) AS count FROM registrations WHERE event_id = @event_id');
  return result.recordset[0].count || 0;
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  softDeleteEvent,
  countRegistrationsForEvent
};
