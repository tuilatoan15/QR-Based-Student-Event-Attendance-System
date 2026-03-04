const { sql, poolPromise } = require('../config/db');

const createEvent = async ({ name, location, max_participants, time, description, created_by }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('name', sql.NVarChar(255), name)
    .input('location', sql.NVarChar(255), location)
    .input('max_participants', sql.Int, max_participants)
    .input('time', sql.DateTime2, new Date(time))
    .input('description', sql.NVarChar(sql.MAX), description)
    .input('created_by', sql.Int, created_by)
    .query(
      `INSERT INTO events (name, location, max_participants, time, description, created_by)
       VALUES (@name, @location, @max_participants, @time, @description, @created_by);
       SELECT SCOPE_IDENTITY() AS id;`
    );

  const insertedId = result.recordset[0].id;
  return { id: insertedId, name, location, max_participants, time, description, created_by };
};

const getAllEvents = async () => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .query(
      `SELECT e.*, u.name AS admin_name, u.email AS admin_email
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.time ASC;`
    );

  return result.recordset;
};

const getEventById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(
      `SELECT e.*, u.name AS admin_name, u.email AS admin_email
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = @id;`
    );

  return result.recordset[0] || null;
};

const countRegistrationsForEvent = async (event_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('event_id', sql.Int, event_id)
    .query('SELECT COUNT(*) AS count FROM registrations WHERE event_id = @event_id;');

  const row = result.recordset[0];
  return row ? row.count : 0;
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  countRegistrationsForEvent
};

