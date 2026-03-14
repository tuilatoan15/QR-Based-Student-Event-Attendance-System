const { sql, poolPromise } = require('../config/db');
const {
  findRegistrationByQrToken,
  hasAttendanceForRegistration,
  REGISTRATION_STATUS
} = require('../models/registrationModel');
const { getEventById } = require('../models/eventModel');
const { getAttendancesForEvent } = require('../models/registrationModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logCheckin } = require('../utils/logger');
const googleSheetService = require('../services/googleSheetService');
const qrService = require('../services/qrService');

const scanQr = async (req, res, next) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    const { qr_token: bodyQrToken, qr_code } = req.body;
    let qr_token = bodyQrToken || qr_code;

    if (!qr_token || typeof qr_token !== 'string' || !qr_token.trim()) {
      return errorResponse(res, 400, 'qr_token is required');
    }

    qr_token = qr_token.trim();

    // Extract QR token if it's a full QR code data
    const extractedToken = qrService.extractQrToken(qr_token);
    if (extractedToken) {
      qr_token = extractedToken;
    }

    // Find registration by QR token
    const registration = await findRegistrationByQrToken(qr_token);

    if (!registration) {
      return errorResponse(res, 404, 'Invalid QR code');
    }

    // NEW: Check if the organizer has permission for this event
    const eventDetails = await getEventById(registration.event_id);
    if (!eventDetails) {
      return errorResponse(res, 404, 'Event associated with this QR not found');
    }

    if (req.user.role !== 'admin' && eventDetails.created_by !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền điểm danh cho sự kiện này');
    }

    // Check if already attended
    if (registration.status === REGISTRATION_STATUS.ATTENDED) {
      return successResponse(res, 200, 'Sinh viên này đã điểm danh trước đó', {
        already_checked_in: true,
        student_name: registration.full_name,
        event_title: registration.event_title
      });
    }

    // Check if attendance record already exists for this registration
    const hasAttendance = await hasAttendanceForRegistration(registration.id);
    if (hasAttendance) {
      return successResponse(res, 200, 'Sinh viên này đã điểm danh trước đó', {
        already_checked_in: true,
        student_name: registration.full_name,
        event_title: registration.event_title
      });
    }

    // Get event details for Google Sheets update
    const event = await pool.request()
      .input('event_id', sql.Int, registration.event_id)
      .query('SELECT google_sheet_name FROM events WHERE id = @event_id');

    const sheetName = event.recordset[0]?.google_sheet_name;

    // Use transaction for atomicity
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // Insert attendance record
      const attendanceResult = await request
        .input('registration_id', sql.Int, registration.id)
        .input('checkin_by', sql.Int, req.user.id)
        .query(
          `INSERT INTO attendances (registration_id, checkin_time, checkin_by)
           OUTPUT INSERTED.checkin_time AS checkin_time
           VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by)`
        );

      const checkin_time = attendanceResult.recordset[0].checkin_time;

      // Update registration status to attended
      await request
        .input('id', sql.Int, registration.id)
        .input('status', sql.NVarChar(20), REGISTRATION_STATUS.ATTENDED)
        .query('UPDATE registrations SET status = @status WHERE id = @id');

      // Create notification for student
      await request
        .input('student_id', sql.Int, registration.user_id)
        .input('notif_title', sql.NVarChar(255), 'Điểm danh thành công')
        .input('notif_msg', sql.NVarChar(sql.MAX), 'Bạn đã điểm danh thành công sự kiện: ' + registration.event_title)
        .query(`INSERT INTO notifications (user_id, title, message) VALUES (@student_id, @notif_title, @notif_msg)`);

      // Commit transaction if all operations succeed
      await transaction.commit();

      // Update Google Sheet (non-critical, don't fail check-in if this fails)
      try {
        if (sheetName) {
          await googleSheetService.updateAttendanceStatus(sheetName, qr_token, checkin_time);
        }
      } catch (sheetError) {
        console.error('Error updating Google Sheet:', sheetError);
      }

      logCheckin(registration.id, req.user.id);
      
      return successResponse(res, 200, 'Điểm danh thành công!', {
        registration_id: registration.id,
        student_name: registration.full_name,
        event_id: registration.event_id,
        event_title: registration.event_title,
        check_in_time: checkin_time
      });
    } catch (transactionError) {
      await transaction.rollback();
      // Handle Unique Key constraint violation (SQL Server error code 2627)
      if (transactionError.number === 2627 || transactionError.code === 'EREQUEST' && transactionError.message.includes('UNIQUE KEY')) {
        return successResponse(res, 200, 'Sinh viên này đã điểm danh trước đó', {
          already_checked_in: true,
          student_name: registration.full_name,
          event_title: registration.event_title
        });
      }
      throw transactionError;
    }
  } catch (err) {
    next(err);
  }
};

const getEventAttendance = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    // Check ownership
    if (req.user.role !== 'admin' && event.created_by !== req.user.id) {
      return errorResponse(res, 403, 'Permission denied: This event does not belong to you');
    }

    const list = await getAttendancesForEvent(eventId);
    return successResponse(res, 200, 'Attendances retrieved successfully', list);
  } catch (err) {
    next(err);
  }
};

const getEventAttendanceStats = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!eventId || !Number.isInteger(eventId)) {
      return errorResponse(res, 400, 'Invalid event id');
    }

    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    // Check ownership
    if (req.user.role !== 'admin' && event.created_by !== req.user.id) {
      return errorResponse(res, 403, 'Permission denied: This event does not belong to you');
    }

    const pool = await poolPromise;

    const registeredRes = await pool
      .request()
      .input('event_id', sql.Int, eventId)
      .query(
        `SELECT COUNT(1) AS total_registered
         FROM registrations
         WHERE event_id = @event_id AND status <> 'cancelled'`
      );

    const attendedRes = await pool
      .request()
      .input('event_id', sql.Int, eventId)
      .query(
        `SELECT COUNT(1) AS total_attended
         FROM attendances a
         JOIN registrations r ON a.registration_id = r.id
         WHERE r.event_id = @event_id`
      );

    const total_registered = registeredRes.recordset[0]?.total_registered ?? 0;
    const total_attended = attendedRes.recordset[0]?.total_attended ?? 0;
    const attendance_rate =
      total_registered > 0
        ? Math.round((total_attended / total_registered) * 100)
        : 0;

    return successResponse(res, 200, 'Attendance stats retrieved successfully', {
      eventId,
      total_registered,
      total_attended,
      attendance_rate
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scanQr,
  getEventAttendance,
  getEventAttendanceStats
};
