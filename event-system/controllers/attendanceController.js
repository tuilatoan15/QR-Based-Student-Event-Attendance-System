const { mongoose } = require('../config/db');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');
const { successResponse, errorResponse } = require('../utils/response');
const { logCheckin } = require('../utils/logger');
const qrService = require('../services/qrService');
const notificationService = require('../services/notificationService');
const { buildLegacyOrObjectIdQuery, isLegacyNumericId } = require('../utils/legacyId');
const { nextLegacySqlId } = require('../utils/legacySequence');
const { getPublicId } = require('../utils/clientFormat');

const serializeAttendance = (attendance, req) => ({
  id: getPublicId(attendance, req),
  mongo_id: attendance._id.toString(),
  attendance_id: getPublicId(attendance, req),
  registration_id:
    attendance.registration_id?.legacy_sql_id ??
    attendance.registration_id?._id?.toString() ??
    null,
  check_in_time: attendance.checkin_time,
  checkin_time: attendance.checkin_time,
  attendance_status: 'attended',
  registration_status: attendance.registration_id?.status || 'attended',
  event_id:
    attendance.event_id?.legacy_sql_id ?? attendance.event_id?._id?.toString() ?? null,
  event_title: attendance.event_id?.title || null,
  user_id:
    attendance.student_id?.legacy_sql_id ?? attendance.student_id?._id?.toString() ?? null,
  student_name: attendance.student_id?.full_name || null,
  full_name: attendance.student_id?.full_name || null,
  email: attendance.student_id?.email || null,
  student_code: attendance.student_id?.student_code || null,
  avatar: attendance.student_id?.avatar || null,
  registered_at: attendance.registration_id?.registered_at || null,
});

const checkInAttendance = async (req, res, next) => {
  try {
    const rawToken = req.body.qr_token || req.body.qr_code;
    if (!rawToken || typeof rawToken !== 'string') {
      return errorResponse(res, 400, 'Yêu cầu cung cấp mã QR');
    }

    const qr_token = qrService.extractQrToken(rawToken.trim());
    if (!qr_token) {
      return errorResponse(res, 400, 'Định dạng mã QR không hợp lệ');
    }

    const registration = await Registration.findOne({ qr_token })
      .populate('user_id', 'full_name email student_code avatar role legacy_sql_id')
      .populate({
        path: 'event_id',
        populate: {
          path: 'created_by',
          select: 'full_name email role legacy_sql_id',
        },
      });

    if (!registration) {
      return errorResponse(res, 404, 'Không tìm thấy thông tin đăng ký cho mã QR này');
    }

    if (!registration.event_id) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    const eventOwnerId = registration.event_id.created_by?._id?.toString();
    if (req.user.role !== 'admin' && eventOwnerId !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền điểm danh cho người này');
    }

    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      return errorResponse(res, 400, 'Đăng ký này đã bị hủy');
    }

    const existingAttendance = await Attendance.findOne({
      registration_id: registration._id,
    })
      .populate('student_id', 'full_name email student_code legacy_sql_id')
      .populate('event_id', 'title legacy_sql_id')
      .populate({ path: 'registration_id', select: 'status registered_at legacy_sql_id' });

    if (existingAttendance || registration.status === REGISTRATION_STATUS.ATTENDED) {
      return successResponse(res, 200, 'Sinh viên này đã được điểm danh trước đó', {
        already_checked_in: true,
        registration_id: getPublicId(registration, req),
        student_name: registration.user_id?.full_name || null,
        student_code: registration.user_id?.student_code || null,
        event_title: registration.event_id.title,
        checkin_time: existingAttendance?.checkin_time || registration.updatedAt,
        check_in_time: existingAttendance?.checkin_time || registration.updatedAt,
      });
    }

    const attendance = await Attendance.create({
      legacy_sql_id: await nextLegacySqlId(req.app.locals.db, 'attendances'),
      registration_id: registration._id,
      event_id: registration.event_id._id,
      student_id: registration.user_id._id,
      checked_in_by: req.user.id,
    });

    registration.status = REGISTRATION_STATUS.ATTENDED;
    await registration.save();

    // Send notification
    await notificationService.sendNotification(
      req.app.locals.db,
      registration.user_id._id,
      'Điểm danh thành công',
      `Bạn đã được điểm danh tham gia sự kiện: ${registration.event_id.title}`,
      'checkin',
      registration.event_id._id
    );

    logCheckin(registration._id.toString(), req.user.id);

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student_id', 'full_name email student_code avatar legacy_sql_id')
      .populate('checked_in_by', 'full_name email role legacy_sql_id')
      .populate('event_id', 'title legacy_sql_id')
      .populate({ path: 'registration_id', select: 'status registered_at legacy_sql_id' });

    return successResponse(res, 200, 'Điểm danh thành công', {
      attendance: serializeAttendance(populatedAttendance, req),
      student_name: populatedAttendance.student_id?.full_name || null,
      check_in_time: populatedAttendance.checkin_time,
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Bản ghi điểm danh đã tồn tại');
    }
    next(error);
  }
};

const getEventAttendance = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id));
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    if (req.user.role !== 'admin' && event.created_by.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền truy cập sự kiện này');
    }

    const attendances = await Attendance.find({ event_id: event._id })
      .populate('student_id', 'full_name email student_code avatar legacy_sql_id')
      .populate('checked_in_by', 'full_name email role legacy_sql_id')
      .populate('event_id', 'title legacy_sql_id')
      .populate({
        path: 'registration_id',
        select: 'qr_token status registered_at legacy_sql_id',
      })
      .lean();

    const data = attendances.map((attendance) => serializeAttendance(attendance, req));
    return successResponse(res, 200, 'Lấy danh sách điểm danh thành công', data);
  } catch (error) {
    next(error);
  }
};

const getEventAttendanceStats = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id));
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    if (req.user.role !== 'admin' && event.created_by.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền truy cập sự kiện này');
    }

    const [totalRegistered, totalAttended] = await Promise.all([
      Registration.countDocuments({
        event_id: event._id,
        status: { $ne: REGISTRATION_STATUS.CANCELLED },
      }),
      Attendance.countDocuments({ event_id: event._id }),
    ]);

    return successResponse(res, 200, 'Lấy thống kê điểm danh thành công', {
      eventId: event.legacy_sql_id ?? event._id.toString(),
      total_registered: totalRegistered,
      total_attended: totalAttended,
      attendance_rate:
        totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
};

const listAttendance = async (req, res, next) => {
  try {
    const { event_id, search } = req.query;
    const filter = {};
    let resolvedEventId = null;

    if (event_id) {
      if (isLegacyNumericId(event_id)) {
        const event = await Event.findOne({ legacy_sql_id: Number(event_id) }).select('_id');
        resolvedEventId = event?._id || null;
      } else {
        resolvedEventId = event_id;
      }
      filter.event_id = resolvedEventId;
    } else if (req.user.role !== 'admin') {
      const organizerEvents = await Event.find({ created_by: req.user.id }).select('_id');
      filter.event_id = { $in: organizerEvents.map((item) => item._id) };
    }

    let records = [];
    if (event_id) {
      // If filtering by event, show ALL registrations for that specific event (full roster)
      const registrations = await Registration.find({
        ...filter,
        status: { $ne: REGISTRATION_STATUS.CANCELLED },
      })
        .populate('user_id', 'full_name email student_code legacy_sql_id')
        .populate('event_id', 'title legacy_sql_id')
        .sort({ registered_at: -1 })
        .lean();

      // Also get attendance records to find check-in times
      const attendances = await Attendance.find({ event_id: resolvedEventId }).select('registration_id checkin_time').lean();
      const attendanceMap = new Map(attendances.map(a => [a.registration_id.toString(), a.checkin_time]));

      records = registrations.map(reg => ({
        id: getPublicId(reg, req),
        mongo_id: reg._id.toString(),
        registration_id: getPublicId(reg, req),
        registration_status: reg.status,
        attendance_status: reg.status === REGISTRATION_STATUS.ATTENDED ? 'attended' : 'registered',
        event_id: getPublicId(reg.event_id, req),
        event_title: reg.event_id?.title || null,
        user_id: getPublicId(reg.user_id, req),
        student_name: reg.user_id?.full_name || null,
        full_name: reg.user_id?.full_name || null,
        email: reg.user_id?.email || null,
        student_code: reg.user_id?.student_code || null,
        check_in_time: attendanceMap.get(reg._id.toString()) || null,
        checkin_time: attendanceMap.get(reg._id.toString()) || null,
        registered_at: reg.registered_at,
      }));
    } else {
      // If no event filter, show chronological check-in history from the Attendance collection
      const attendances = await Attendance.find(filter)
        .populate('student_id', 'full_name email student_code legacy_sql_id')
        .populate('event_id', 'title legacy_sql_id')
        .populate({
          path: 'registration_id',
          select: 'status registered_at legacy_sql_id',
        })
        .sort({ checkin_time: -1 })
        .lean();
      records = attendances.map(a => serializeAttendance(a, req));
    }

    const term = (search || '').toString().trim().toLowerCase();
    const data = records.filter((item) => {
      if (!term) return true;
      return [item.student_name, item.email, item.student_code, item.event_title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });

    return successResponse(res, 200, 'Lấy danh sách điểm danh thành công', data);
  } catch (error) {
    next(error);
  }
};

const manualCheckinByStudent = async (req, res, next) => {
  try {
    const { student_code, event_id } = req.body;

    if (!student_code || !event_id) {
      return errorResponse(res, 400, 'Yêu cầu nhập mã sinh viên và ID sự kiện');
    }

    let resolvedEventId = event_id;
    if (isLegacyNumericId(event_id)) {
      const event = await Event.findOne({ legacy_sql_id: Number(event_id) }).select('_id');
      resolvedEventId = event?._id?.toString();
    }

    const student = await User.findOne({ student_code: student_code.trim() }).select('_id');
    if (!student) {
      return errorResponse(res, 404, 'Không tìm thấy sinh viên');
    }

    const registration = await Registration.findOne({
      event_id: resolvedEventId,
      user_id: student._id,
      status: { $ne: REGISTRATION_STATUS.CANCELLED },
    }).select('qr_token');

    if (!registration) {
      return errorResponse(res, 404, 'Không tìm thấy thông tin đăng ký');
    }

    req.body.qr_token = registration.qr_token;
    return checkInAttendance(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getBulkEventStats = async (req, res, next) => {
  try {
    const { eventIds } = req.query;
    if (!eventIds) {
      return errorResponse(res, 400, 'Yêu cầu cung cấp danh sách ID sự kiện');
    }

    const ids = eventIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => mongoose.isValidObjectId(id) || isLegacyNumericId(id));

    if (ids.length === 0) {
      return successResponse(res, 200, 'Không tìm thấy ID sự kiện hợp lệ', []);
    }

    // Convert IDs to ObjectIds if they are valid
    const objectIds = [];
    const legacyIds = [];

    for (const id of ids) {
      if (mongoose.isValidObjectId(id)) {
        objectIds.push(new mongoose.Types.ObjectId(id));
      } else if (isLegacyNumericId(id)) {
        legacyIds.push(Number(id));
      }
    }

    // Resolve mongo_ids for legacy numeric IDs
    if (legacyIds.length > 0) {
      const resolvedEvents = await Event.find({ legacy_sql_id: { $in: legacyIds } }).select('_id');
      resolvedEvents.forEach((e) => objectIds.push(e._id));
    }

    // Single query for all registrations (total) grouped by event_id
    const registrationStats = await Registration.aggregate([
      {
        $match: {
          event_id: { $in: objectIds },
          status: { $ne: REGISTRATION_STATUS.CANCELLED },
        },
      },
      {
        $group: {
          _id: '$event_id',
          total_registered: { $sum: 1 },
        },
      },
    ]);

    // Single query for all attendances (checked-in) grouped by event_id
    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          event_id: { $in: objectIds },
        },
      },
      {
        $group: {
          _id: '$event_id',
          total_attended: { $sum: 1 },
        },
      },
    ]);

    // Map stats back to event IDs
    const statsMap = {};
    objectIds.forEach((id) => {
      statsMap[id.toString()] = {
        mongo_id: id.toString(),
        total_registered: 0,
        total_attended: 0,
      };
    });

    registrationStats.forEach((item) => {
      if (statsMap[item._id.toString()]) {
        statsMap[item._id.toString()].total_registered = item.total_registered;
      }
    });

    attendanceStats.forEach((item) => {
      if (statsMap[item._id.toString()]) {
        statsMap[item._id.toString()].total_attended = item.total_attended;
      }
    });

    const data = Object.values(statsMap).map((item) => ({
      ...item,
      attendance_rate:
        item.total_registered > 0
          ? Math.round((item.total_attended / item.total_registered) * 100)
          : 0,
    }));

    return successResponse(res, 200, 'Lấy thống kê điểm danh hàng loạt thành công', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkInAttendance,
  getBulkEventStats,
  getEventAttendance,
  getEventAttendanceStats,
  listAttendance,
  manualCheckinByStudent,
};

