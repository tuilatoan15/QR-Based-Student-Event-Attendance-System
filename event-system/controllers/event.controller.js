const { sql, poolPromise } = require('../config/db');

const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      start_time,
      end_time,
      max_participants,
      category_id
    } = req.body;

    if (!title || !location || !start_time || !end_time || !max_participants) {
      return res.status(400).json({
        message: 'title, location, start_time, end_time, max_participants are required'
      });
    }

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
      .input('created_by', sql.Int, req.user.id)
      .query(
        `INSERT INTO events
           (title, description, location, start_time, end_time, max_participants,
            category_id, created_by, is_active, created_at)
         VALUES
           (@title, @description, @location, @start_time, @end_time, @max_participants,
            @category_id, @created_by, 1, SYSUTCDATETIME());
         SELECT SCOPE_IDENTITY() AS id;`
      );

    const eventId = result.recordset[0].id;

    res.status(201).json({
      message: 'Event created successfully',
      event: { id: eventId }
    });
  } catch (err) {
    next(err);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT e.*, c.name AS category_name, u.full_name AS created_by_name
         FROM events e
         LEFT JOIN event_categories c ON e.category_id = c.id
         LEFT JOIN users u ON e.created_by = u.id
         WHERE e.is_active = 1`
      );

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('id', sql.Int, eventId)
      .query(
        `SELECT e.*, c.name AS category_name, u.full_name AS created_by_name
         FROM events e
         LEFT JOIN event_categories c ON e.category_id = c.id
         LEFT JOIN users u ON e.created_by = u.id
         WHERE e.id = @id`
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const {
      title,
      description,
      location,
      start_time,
      end_time,
      max_participants,
      category_id,
      is_active
    } = req.body;

    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input('id', sql.Int, eventId)
      .query('SELECT id FROM events WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await pool
      .request()
      .input('id', sql.Int, eventId)
      .input('title', sql.NVarChar(255), title || null)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('location', sql.NVarChar(255), location || null)
      .input('start_time', sql.DateTime2, start_time ? new Date(start_time) : null)
      .input('end_time', sql.DateTime2, end_time ? new Date(end_time) : null)
      .input('max_participants', sql.Int, max_participants || null)
      .input('category_id', sql.Int, category_id || null)
      .input('is_active', sql.Bit, typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null)
      .query(
        `UPDATE events
         SET
           title = COALESCE(@title, title),
           description = COALESCE(@description, description),
           location = COALESCE(@location, location),
           start_time = COALESCE(@start_time, start_time),
           end_time = COALESCE(@end_time, end_time),
           max_participants = COALESCE(@max_participants, max_participants),
           category_id = COALESCE(@category_id, category_id),
           is_active = COALESCE(@is_active, is_active)
         WHERE id = @id`
      );

    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    next(err);
  }
};

const deleteEventSoft = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input('id', sql.Int, eventId)
      .query('SELECT id FROM events WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await pool
      .request()
      .input('id', sql.Int, eventId)
      .query('UPDATE events SET is_active = 0 WHERE id = @id');

    res.json({ message: 'Event soft-deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEventSoft
};

