const { sql, poolPromise } = require('../config/db');

const checkIn = async (req, res, next) => {
  try {
    const { qr_token } = req.body;
    const checkinBy = req.user.id;

    if (!qr_token) {
      return res.status(400).json({ message: 'qr_token is required' });
    }

    const pool = await poolPromise;

    const regResult = await pool
      .request()
      .input('qr_token', sql.NVarChar(255), qr_token)
      .query(
        `SELECT r.*, e.title AS event_title
         FROM registrations r
         JOIN events e ON r.event_id = e.id
         WHERE r.qr_token = @qr_token`
      );

    if (regResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Registration not found for this QR token' });
    }

    const registration = regResult.recordset[0];

    const attendanceResult = await pool
      .request()
      .input('registration_id', sql.Int, registration.id)
      .query(
        `SELECT id FROM attendances
         WHERE registration_id = @registration_id`
      );

    if (attendanceResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    await pool
      .request()
      .input('registration_id', sql.Int, registration.id)
      .input('checkin_by', sql.Int, checkinBy)
      .query(
        `INSERT INTO attendances (registration_id, checkin_time, checkin_by)
         VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by);`
      );

    await pool
      .request()
      .input('id', sql.Int, registration.id)
      .input('status', sql.NVarChar(20), 'checked_in')
      .query(
        `UPDATE registrations
         SET status = @status
         WHERE id = @id`
      );

    res.json({
      message: 'Check-in successful',
      data: {
        registration_id: registration.id,
        event_id: registration.event_id,
        user_id: registration.user_id
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn
};

