const { sql, poolPromise } = require('../config/db');
const {
  findRegistrationByQrToken,
  hasAttendanceForRegistration,
  REGISTRATION_STATUS
} = require('../models/registrationModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logCheckin } = require('../utils/logger');

const checkIn = async (req, res, next) => {
  try {
    const { qr_token: bodyQrToken, qr_code } = req.body;
    const raw = bodyQrToken || qr_code;
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return errorResponse(res, 400, 'qr_token is required');
    }

    const qr_token = raw.trim();
    const registration = await findRegistrationByQrToken(qr_token);

    if (!registration) {
      return errorResponse(res, 404, 'Invalid QR code');
    }

    if (registration.status !== REGISTRATION_STATUS.REGISTERED) {
      return errorResponse(res, 409, 'Already checked in');
    }

    if (registration.event_is_active !== 1 && registration.event_is_active !== true) {
      return errorResponse(res, 400, 'Event is not active');
    }

    const alreadyHasAttendance = await hasAttendanceForRegistration(registration.id);
    if (alreadyHasAttendance) {
      return errorResponse(res, 409, 'Already checked in');
    }

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();
      const txRequest = new sql.Request(transaction);

      const insertResult = await txRequest
        .input('registration_id', sql.Int, registration.id)
        .input('checkin_by', sql.Int, req.user.id)
        .query(
          `INSERT INTO attendances (registration_id, checkin_time, checkin_by)
           OUTPUT INSERTED.checkin_time AS checkin_time
           VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by)`
        );
      const checkin_time = insertResult.recordset[0].checkin_time;

      await txRequest
        .input('reg_id', sql.Int, registration.id)
        .input('status', sql.NVarChar(20), REGISTRATION_STATUS.ATTENDED)
        .query('UPDATE registrations SET status = @status WHERE id = @reg_id');

      await transaction.commit();

      logCheckin(registration.id, req.user.id);

      return successResponse(res, 200, 'Check-in successful', {
        registration_id: registration.id,
        checked_in_by: req.user.id,
        check_in_time: checkin_time
      });
    } catch (txErr) {
      try {
        await transaction.rollback();
      } catch (_) {}
      next(txErr);
    }
  } catch (err) {
    next(err);
  }
};
