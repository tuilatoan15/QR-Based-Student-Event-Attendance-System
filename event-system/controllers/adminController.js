const { poolPromise, sql } = require('../config/db');
const { errorResponse, successResponse, paginatedSuccessResponse } = require('../utils/response');
const { listUsers, countUsers, setUserRoleByName, setUserActive, findUserById } = require('../models/userModel');
const { getRegistrationById, updateRegistrationStatus, REGISTRATION_STATUS } = require('../models/registrationModel');

const listUsersHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = String(req.query.search || '');
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 20;
    const offset = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      listUsers({ offset, limit: safeLimit, search }),
      countUsers({ search })
    ]);

    return paginatedSuccessResponse(res, 200, 'Users retrieved successfully', items, {
      page: safePage,
      limit: safeLimit,
      total
    });
  } catch (err) {
    next(err);
  }
};

const updateUserRoleHandler = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body || {};
    if (!userId || !Number.isInteger(userId)) return errorResponse(res, 400, 'Invalid user id');
    if (!role || typeof role !== 'string') return errorResponse(res, 400, 'role is required');
    if (req.user?.id === userId) return errorResponse(res, 400, 'You cannot change your own role');

    const existing = await findUserById(userId);
    if (!existing) return errorResponse(res, 404, 'User not found');

    const ok = await setUserRoleByName(userId, role);
    if (!ok) return errorResponse(res, 400, 'Invalid role');

    return successResponse(res, 200, 'User role updated successfully', { id: userId, role });
  } catch (err) {
    next(err);
  }
};

const deactivateUserHandler = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { is_active } = req.body || {};
    if (!userId || !Number.isInteger(userId)) return errorResponse(res, 400, 'Invalid user id');
    if (typeof is_active !== 'boolean') return errorResponse(res, 400, 'is_active (boolean) is required');
    if (req.user?.id === userId) return errorResponse(res, 400, 'You cannot deactivate your own account');

    const existing = await findUserById(userId);
    if (!existing) return errorResponse(res, 404, 'User not found');

    await setUserActive(userId, is_active);
    return successResponse(res, 200, 'User updated successfully', { id: userId, is_active });
  } catch (err) {
    next(err);
  }
};

const updateRegistrationStatusHandler = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    const registrationId = parseInt(req.params.registrationId, 10);
    const { status } = req.body || {};
    if (!eventId || !Number.isInteger(eventId)) return errorResponse(res, 400, 'Invalid event id');
    if (!registrationId || !Number.isInteger(registrationId)) return errorResponse(res, 400, 'Invalid registration id');
    if (!status || typeof status !== 'string') return errorResponse(res, 400, 'status is required');

    const normalized = status.toLowerCase();
    const allowed = new Set([
      REGISTRATION_STATUS.REGISTERED,
      REGISTRATION_STATUS.CANCELLED,
      REGISTRATION_STATUS.ATTENDED
    ]);
    if (!allowed.has(normalized)) return errorResponse(res, 400, 'Invalid status');

    const reg = await getRegistrationById(registrationId);
    if (!reg) return errorResponse(res, 404, 'Registration not found');
    if (parseInt(reg.event_id, 10) !== eventId) return errorResponse(res, 400, 'Registration does not belong to this event');

    await updateRegistrationStatus(registrationId, normalized);
    return successResponse(res, 200, 'Registration status updated successfully', {
      id: registrationId,
      event_id: eventId,
      status: normalized
    });
  } catch (err) {
    next(err);
  }
};

const listAttendanceHandler = async (req, res, next) => {
  try {
    const eventId = req.query.event_id ? parseInt(req.query.event_id, 10) : null;
    const search = String(req.query.search || '').trim();

    const pool = await poolPromise;
    const request = pool.request();

    let whereSql = 'WHERE 1=1';
    if (eventId && Number.isInteger(eventId)) {
      request.input('event_id', sql.Int, eventId);
      whereSql += ' AND r.event_id = @event_id';
    }
    if (search) {
      request.input('search', sql.NVarChar(255), `%${search}%`);
      whereSql += ' AND (u.full_name LIKE @search OR u.email LIKE @search OR u.student_code LIKE @search OR e.title LIKE @search)';
    }

    const result = await request.query(
      `SELECT 
         a.id AS attendance_id,
         a.registration_id,
         a.check_in_time AS check_in_time,
         a.status AS attendance_status,
         r.event_id,
         r.status AS registration_status,
         u.id AS user_id,
         u.full_name AS student_name,
         u.email,
         u.student_code,
         e.title AS event_title
       FROM attendances a
       JOIN registrations r ON a.registration_id = r.id
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       ${whereSql}
       ORDER BY a.check_in_time DESC`
    );

    return successResponse(res, 200, 'Attendance retrieved successfully', result.recordset);
  } catch (err) {
    next(err);
  }
};

// Manual check-in by registration_id (admin/organizer)
const manualCheckinHandler = async (req, res, next) => {
  try {
    const { registration_id } = req.body || {};
    const regId = parseInt(registration_id, 10);
    if (!regId || !Number.isInteger(regId)) return errorResponse(res, 400, 'registration_id is required');

    // Reuse the existing scan-qr flow by looking up the QR token.
    // This keeps check-in logic consistent (attendance insert + status update + sheets update).
    const reg = await getRegistrationById(regId);
    if (!reg) return errorResponse(res, 404, 'Registration not found');

    // Delegate to attendanceController via HTTP-like call is messy; do minimal inline:
    // Insert attendance if not already checked in.
    const pool = await poolPromise;
    const exists = await pool
      .request()
      .input('registration_id', sql.Int, regId)
      .query('SELECT TOP 1 id FROM attendances WHERE registration_id = @registration_id');
    if (exists.recordset.length > 0) return errorResponse(res, 409, 'Already checked in');

    const attendanceResult = await pool
      .request()
      .input('registration_id', sql.Int, regId)
      .query(
        `INSERT INTO attendances (registration_id, check_in_time, status)
         OUTPUT INSERTED.check_in_time AS check_in_time
         VALUES (@registration_id, SYSUTCDATETIME(), 'checked_in')`
      );

    await updateRegistrationStatus(regId, REGISTRATION_STATUS.ATTENDED);

    return successResponse(res, 200, 'Manual check-in successful', {
      registration_id: regId,
      event_id: reg.event_id,
      student_name: reg.full_name,
      check_in_time: attendanceResult.recordset[0].check_in_time
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsersHandler,
  updateUserRoleHandler,
  deactivateUserHandler,
  updateRegistrationStatusHandler,
  listAttendanceHandler,
  manualCheckinHandler
};

