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

// NOTE: Registration status is controlled by student actions + QR attendance only.
// No manual registration status mutation endpoint is exposed via admin API.

const listAttendanceHandler = async (req, res, next) => {
  try {
    const eventId = req.query.event_id ? parseInt(req.query.event_id, 10) : null;
    const search = String(req.query.search || '').trim();

    const pool = await poolPromise;
    const request = pool.request();

    let whereSql = 'WHERE 1=1';

    // If user is organizer, only show registrations for their events
    if (req.user.role !== 'admin') {
      request.input('organizer_id', sql.Int, req.user.id);
      whereSql += ' AND e.created_by = @organizer_id';
    }

    if (eventId && Number.isInteger(eventId)) {
      request.input('event_id', sql.Int, eventId);
      whereSql += ' AND r.event_id = @event_id';
    } else {
      // When no specific event selected, only show attended records (default behaviour)
      whereSql += " AND r.status = 'attended'";
    }

    if (search) {
      request.input('search', sql.NVarChar(255), `%${search}%`);
      whereSql += ' AND (u.full_name LIKE @search OR u.email LIKE @search OR u.student_code LIKE @search OR e.title LIKE @search)';
    }

    const result = await request.query(
      `SELECT 
         a.id AS attendance_id,
         r.id AS registration_id,
         a.checkin_time AS check_in_time,
         a.checkin_by AS checkin_by,
         r.event_id,
         r.status AS registration_status,
         u.id AS user_id,
         u.full_name AS student_name,
         u.email,
         u.student_code,
         e.title AS event_title,
         r.registered_at
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       LEFT JOIN attendances a ON a.registration_id = r.id
       ${whereSql}
       ORDER BY 
         CASE WHEN r.status = 'attended' THEN 0 ELSE 1 END,
         a.checkin_time DESC,
         r.registered_at DESC`
    );

    return successResponse(res, 200, 'Attendance retrieved successfully', result.recordset);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsersHandler,
  updateUserRoleHandler,
  deactivateUserHandler,
  listAttendanceHandler
};

