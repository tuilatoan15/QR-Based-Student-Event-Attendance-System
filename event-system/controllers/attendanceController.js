const { sql, poolPromise } = require('../config/db');
const {
  findRegistrationByQrToken,
  hasAttendanceForRegistration,
  REGISTRATION_STATUS
} = require('../models/registrationModel');
const { findEventMemberByQrCode, updateAttendanceStatus } = require('../models/eventMemberModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logCheckin } = require('../utils/logger');
const googleSheetService = require('../services/googleSheetService');

const checkIn = async (req, res, next) => {
  try {
    const { qr_token: bodyQrToken, qr_code } = req.body;
    const raw = bodyQrToken || qr_code;
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return errorResponse(res, 400, 'qr_token is required');
    }

    const qr_token = raw.trim();
    const eventMember = await findEventMemberByQrCode(qr_token);

    if (!eventMember) {
      return errorResponse(res, 404, 'Invalid QR code');
    }

    if (eventMember.attendance_status === 1) {
      return errorResponse(res, 409, 'Already checked in');
    }

    // Update attendance status in database
    const checkin_time = new Date();
    await updateAttendanceStatus(eventMember.id, 1, checkin_time);

    // Update Google Sheet
    try {
      await googleSheetService.markAttendance(qr_token);
    } catch (sheetError) {
      console.error('Error updating Google Sheet:', sheetError);
      // Don't fail check-in if sheet update fails
    }

    logCheckin(eventMember.id, req.user.id);

    return successResponse(res, 200, 'Check-in successful', {
      event_member_id: eventMember.id,
      student_name: eventMember.student_name,
      event_id: eventMember.event_id,
      checked_in_by: req.user.id,
      check_in_time: checkin_time
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn
};
