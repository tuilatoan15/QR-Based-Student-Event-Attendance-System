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

    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      return errorResponse(res, 400, 'Sinh viên này đã huỷ đăng ký sự kiện');
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
    const existingAttendance = await pool.request()
      .input('reg_id', sql.Int, registration.id)
      .query('SELECT checkin_time AS check_in_time FROM attendances WHERE registration_id = @reg_id');

    if (registration.status === REGISTRATION_STATUS.ATTENDED || existingAttendance.recordset.length > 0) {
      const checkinTime = existingAttendance.recordset[0]?.check_in_time || registration.updated_at; // Fallback to updated_at if somehow missing
      return successResponse(res, 200, 'Sinh viên này đã điểm danh trước đó', {
        already_checked_in: true,
        student_name: registration.full_name,
        student_code: registration.student_code,
        event_title: registration.event_title,
        check_in_time: checkinTime
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
           OUTPUT INSERTED.checkin_time AS check_in_time
           VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by)`
        );

      const check_in_time = attendanceResult.recordset[0].check_in_time;

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
        .input('notif_type', sql.NVarChar(50), 'checkin')
        .input('event_id', sql.Int, registration.event_id)
        .query(`INSERT INTO notifications (user_id, title, message, [type], event_id) VALUES (@student_id, @notif_title, @notif_msg, @notif_type, @event_id)`);

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
        check_in_time: check_in_time
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

// Manual check-in by student_code + event_id
const manualCheckinByStudent = async (req, res, next) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    const { student_code, event_id } = req.body;

    if (!student_code || !event_id) {
      return errorResponse(res, 400, 'student_code v\u00e0 event_id l\u00e0 b\u1eaft bu\u1ed9c');
    }

    // Verify organizer permission
    const event = await getEventById(event_id);
    if (!event) return errorResponse(res, 404, 'Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ef1 ki\u1ec7n');
    if (req.user.role !== 'admin' && event.created_by !== req.user.id) {
      return errorResponse(res, 403, 'B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n \u0111i\u1ec3m danh cho s\u1ef1 ki\u1ec7n n\u00e0y');
    }

    // Find registration by student_code + event_id
    const regRes = await pool.request()
      .input('student_code', sql.NVarChar(50), student_code.trim().toUpperCase())
      .input('event_id', sql.Int, parseInt(event_id, 10))
      .query(`
        SELECT r.id AS registration_id, r.status, u.full_name, u.student_code, r.user_id, e.title AS event_title
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        JOIN events e ON r.event_id = e.id
        WHERE UPPER(u.student_code) = @student_code
          AND r.event_id = @event_id
      `);

    const reg = regRes.recordset[0];
    if (!reg) {
      return errorResponse(res, 404, `Kh\u00f4ng t\u00ecm th\u1ea5y \u0111\u0103ng k\u00fd cho MSSV: ${student_code} t\u1ea1i s\u1ef1 ki\u1ec7n n\u00e0y`);
    }

    if (reg.status === 'cancelled') {
       return errorResponse(res, 400, 'Sinh viên này đã huỷ đăng ký sự kiện');
    }

    if (reg.status === 'attended') {
      const existingAtt = await pool.request()
        .input('reg_id', sql.Int, reg.registration_id)
        .query('SELECT checkin_time AS check_in_time FROM attendances WHERE registration_id = @reg_id');
      
      const checkinTime = existingAtt.recordset[0]?.check_in_time;

      return successResponse(res, 200, 'Sinh viên này đã điểm danh trước đó', {
        already_checked_in: true,
        student_name: reg.full_name,
        student_code: reg.student_code,
        event_title: reg.event_title,
        check_in_time: checkinTime
      });
    }

    await transaction.begin();
    try {
      const request = new sql.Request(transaction);

      const attResult = await request
        .input('registration_id', sql.Int, reg.registration_id)
        .input('checkin_by', sql.Int, req.user.id)
        .query(`
          INSERT INTO attendances (registration_id, checkin_time, checkin_by)
          OUTPUT INSERTED.checkin_time AS check_in_time
          VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by)
        `);

      const check_in_time = attResult.recordset[0].check_in_time;

      await request
        .input('reg_id', sql.Int, reg.registration_id)
        .input('status', sql.NVarChar(20), 'attended')
        .query('UPDATE registrations SET status = @status WHERE id = @reg_id');

      // Notification
      await request
        .input('student_id', sql.Int, reg.user_id)
        .input('notif_title', sql.NVarChar(255), 'Điểm danh thành công')
        .input('notif_msg', sql.NVarChar(sql.MAX), 'Bạn đã điểm danh thành công sự kiện: ' + reg.event_title)
        .input('notif_type', sql.NVarChar(50), 'checkin')
        .input('event_id', sql.Int, reg.event_id || event_id)
        .query('INSERT INTO notifications (user_id, title, message, [type], event_id) VALUES (@student_id, @notif_title, @notif_msg, @notif_type, @event_id)');

      await transaction.commit();

      return successResponse(res, 200, '\u0110i\u1ec3m danh th\u1ee7 c\u00f4ng th\u00e0nh c\u00f4ng!', {
        student_name: reg.full_name,
        student_code: reg.student_code,
        event_title: reg.event_title,
        check_in_time: check_in_time
      });
    } catch (txErr) {
      await transaction.rollback();
      if (txErr.number === 2627) {
        return successResponse(res, 200, 'Sinh vi\u00ean n\u00e0y \u0111\u00e3 \u0111i\u1ec3m danh tr\u01b0\u1edbc \u0111\u00f3', {
          already_checked_in: true,
          student_name: reg.full_name
        });
      }
      throw txErr;
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scanQr,
  getEventAttendance,
  getEventAttendanceStats,
  manualCheckinByStudent
};
