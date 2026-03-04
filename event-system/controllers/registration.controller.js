const { sql, poolPromise } = require('../config/db');
const generateQrToken = require('../utils/generateQrToken');

const registerForEvent = async (req, res, next) => {
  try {
    const { event_id } = req.body;
    const userId = req.user.id;

    if (!event_id) {
      return res.status(400).json({ message: 'event_id is required' });
    }

    const pool = await poolPromise;

    const eventResult = await pool
      .request()
      .input('id', sql.Int, event_id)
      .query('SELECT * FROM events WHERE id = @id AND is_active = 1');

    if (eventResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Event not found or inactive' });
    }

    const event = eventResult.recordset[0];

    const dupResult = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .input('event_id', sql.Int, event_id)
      .query(
        `SELECT id FROM registrations
         WHERE user_id = @user_id AND event_id = @event_id`
      );

    if (dupResult.recordset.length > 0) {
      return res.status(409).json({ message: 'Already registered for this event' });
    }

    const countResult = await pool
      .request()
      .input('event_id', sql.Int, event_id)
      .query(
        `SELECT COUNT(*) AS count
         FROM registrations
         WHERE event_id = @event_id`
      );

    const currentCount = countResult.recordset[0].count || 0;

    if (currentCount >= event.max_participants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const qrToken = generateQrToken();

    const insertResult = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .input('event_id', sql.Int, event_id)
      .input('qr_token', sql.NVarChar(255), qrToken)
      .input('status', sql.NVarChar(20), 'registered')
      .query(
        `INSERT INTO registrations (user_id, event_id, qr_token, status, registered_at)
         VALUES (@user_id, @event_id, @qr_token, @status, SYSUTCDATETIME());
         SELECT SCOPE_IDENTITY() AS id;`
      );

    const registrationId = insertResult.recordset[0].id;

    res.status(201).json({
      message: 'Registered successfully',
      registration: {
        id: registrationId,
        user_id: userId,
        event_id,
        qr_token: qrToken,
        status: 'registered'
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('user_id', sql.Int, userId)
      .query(
        `SELECT r.*, e.title AS event_title, e.location, e.start_time, e.end_time
         FROM registrations r
         JOIN events e ON r.event_id = e.id
         WHERE r.user_id = @user_id`
      );

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

const getRegistrationsByEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('event_id', sql.Int, eventId)
      .query(
        `SELECT r.*, u.full_name, u.email, u.student_code
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         WHERE r.event_id = @event_id`
      );

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getRegistrationsByEvent
};

