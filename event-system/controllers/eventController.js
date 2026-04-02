const Event = require('../models/eventModel');
const User = require('../models/userModel');
const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');
const qrService = require('../services/qrService');
const notificationService = require('../services/notificationService');
const { buildLegacyOrObjectIdQuery } = require('../utils/legacyId');
const { nextLegacySqlId } = require('../utils/legacySequence');
const { getPublicId } = require('../utils/clientFormat');
const {
  successResponse,
  paginatedSuccessResponse,
  errorResponse,
} = require('../utils/response');

// Bộ nhớ đệm đơn giản cho thống kê (Sát thủ tốc độ)
const statsCache = new Map();
const CACHE_TTL = 300000; // 5 phút

const getCachedStatsCount = (key) => {
  const cached = statsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setStatsCache = (key, data) => {
  statsCache.set(key, { data, timestamp: Date.now() });
};

const eventPopulate = {
  path: 'created_by',
  select: 'full_name email role student_code legacy_sql_id',
};

const buildCountMaps = async (eventIds) => {
  if (!eventIds.length) {
    return { registrationMap: new Map(), attendanceMap: new Map() };
  }

  const cacheKey = eventIds.sort().join(',');
  const cached = getCachedStatsCount(cacheKey);
  if (cached) return cached;

  const [registrationCounts, attendanceCounts] = await Promise.all([
    Registration.aggregate([
      { $match: { event_id: { $in: eventIds }, status: { $ne: REGISTRATION_STATUS.CANCELLED } } },
      { $group: { _id: '$event_id', count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { event_id: { $in: eventIds } } },
      { $group: { _id: '$event_id', count: { $sum: 1 } } },
    ]),
  ]);

  const result = {
    registrationMap: new Map(registrationCounts.map((item) => [item._id.toString(), item.count])),
    attendanceMap: new Map(attendanceCounts.map((item) => [item._id.toString(), item.count])),
  };

  setStatsCache(cacheKey, result);
  return result;
};

const serializeEvent = (eventDocument, req, countMaps, isList = false) => {
  const eventId = eventDocument._id ? eventDocument._id.toString() : eventDocument.id;
  const registrationCount = countMaps?.registrationMap?.get(eventId) ?? 0;
  const attendanceCount = countMaps?.attendanceMap?.get(eventId) ?? 0;

  return {
    id: getPublicId(eventDocument, req),
    mongo_id: eventId,
    title: eventDocument.title,
    // Hiện lại phần mô tả (rút gọn nếu là danh sách để tối ưu tốc độ)
    description: isList && eventDocument.description 
      ? (eventDocument.description.length > 100 ? eventDocument.description.substring(0, 100) + '...' : eventDocument.description)
      : (eventDocument.description || ""),
    // Trả về 1 ảnh banner cho danh sách
    images: Array.isArray(eventDocument.images) ? eventDocument.images : [],
    location: eventDocument.location,
    start_time: eventDocument.start_time,
    end_time: eventDocument.end_time,
    max_participants: eventDocument.max_participants,
    is_active: eventDocument.is_active,
    registration_count: registrationCount,
    registered_count: registrationCount,
    attendance_count: attendanceCount,
    checked_in_count: attendanceCount,
  };
};

const listEventsWithCounts = async (req, filter, sort, page, limit) => {
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate(eventPopulate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  const countMaps = await buildCountMaps(events.map((event) => event._id));
  const data = events.map((event) => serializeEvent(event, req, countMaps, true));

  return {
    data,
    total,
  };
};

const getEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const search = String(req.query.search || '').trim();
    
    const filter = { is_active: true };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const { data, total } = await listEventsWithCounts(
      req,
      filter,
      { start_time: 1 },
      page,
      limit
    );

    return paginatedSuccessResponse(res, 200, 'Lấy danh sách sự kiện thành công', data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id))
      .populate(eventPopulate)
      .lean();
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    const countMaps = await buildCountMaps([event._id]);
    return successResponse(
      res,
      200,
      'Lấy thông tin sự kiện thành công',
      serializeEvent(event, req, countMaps)
    );
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const legacy_sql_id = await nextLegacySqlId(req.app.locals.db, 'events');
    const event = await Event.create({
      legacy_sql_id,
      title: req.body.title,
      description: req.body.description || '',
      location: req.body.location,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      max_participants: req.body.max_participants,
      category_id: req.body.category_id || null,
      images: Array.isArray(req.body.images) ? req.body.images : [],
      created_by: req.user.id,
    });

    const populatedEvent = await Event.findById(event._id).populate(eventPopulate).lean();
    const countMaps = await buildCountMaps([event._id]);
    return successResponse(
      res,
      201,
      'Tạo sự kiện thành công',
      serializeEvent(populatedEvent, req, countMaps)
    );
  } catch (error) {
    next(error);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id));
    if (!event || !event.is_active) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'Không tìm thấy người dùng');
    }

    const existingRegistration = await Registration.findOne({
      user_id: req.user.id,
      event_id: event._id,
    });

    if (existingRegistration && existingRegistration.status !== REGISTRATION_STATUS.CANCELLED) {
      return errorResponse(res, 409, 'Bạn đã đăng ký sự kiện này rồi');
    }

    const registrationCount = await Registration.countDocuments({
      event_id: event._id,
      status: { $ne: REGISTRATION_STATUS.CANCELLED },
    });

    if (registrationCount >= event.max_participants) {
      return errorResponse(res, 409, 'Sự kiện đã hết chỗ');
    }

    const qr_token = qrService.generateQrToken();

    let registration;
    if (existingRegistration) {
      existingRegistration.status = REGISTRATION_STATUS.REGISTERED;
      existingRegistration.qr_token = qr_token;
      existingRegistration.registered_at = new Date();
      registration = await existingRegistration.save();
    } else {
      registration = await Registration.create({
        legacy_sql_id: await nextLegacySqlId(req.app.locals.db, 'registrations'),
        user_id: req.user.id,
        event_id: event._id,
        qr_token,
      });
    }

    const qr_code = await qrService.generateQRCodeDataURL(qr_token);

    // Send notification
    await notificationService.sendNotification(
      req.app.locals.db,
      req.user.id,
      'Đăng ký thành công!',
      `Bạn đã đăng ký tham gia sự kiện: ${event.title}`,
      'registration',
      event._id
    );

    return successResponse(res, 201, 'Đăng ký tham gia thành công', {
      registration: {
        id: getPublicId(registration, req),
        mongo_id: registration._id.toString(),
        event_id: getPublicId(event, req),
        event_mongo_id: event._id.toString(),
        user_id: getPublicId(user, req),
        user_mongo_id: user._id.toString(),
        qr_token: registration.qr_token,
        status: registration.status,
        registered_at: registration.registered_at,
      },
      qr_token,
      qr_code,
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 409, 'Bạn đã đăng ký sự kiện này rồi');
    }
    next(error);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id));
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    const registration = await Registration.findOne({
      user_id: req.user.id,
      event_id: event._id,
      status: { $ne: REGISTRATION_STATUS.CANCELLED },
    });

    if (!registration) {
      return errorResponse(res, 404, 'Không tìm thấy thông tin đăng ký');
    }

    registration.status = REGISTRATION_STATUS.CANCELLED;
    await registration.save();

    // Delete attendance record if it exists
    await Attendance.deleteMany({ registration_id: registration._id });

    // Send notification
    await notificationService.sendNotification(
      req.app.locals.db,
      req.user.id,
      'Đã hủy đăng ký',
      `Bạn đã hủy đăng ký tham gia sự kiện: ${event.title}`,
      'cancellation',
      event._id
    );

    return successResponse(res, 200, 'Đã hủy đăng ký thành công', {
      id: getPublicId(registration, req),
      event_id: getPublicId(event, req),
      status: registration.status,
    });
  } catch (error) {
    next(error);
  }
};

const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id)).lean();
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    if (req.user.role !== 'admin' && event.created_by.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền truy cập sự kiện này');
    }

    const registrations = await Registration.find({ event_id: event._id })
      .populate('user_id', 'full_name email student_code role avatar legacy_sql_id')
      .populate('event_id', 'title start_time end_time location legacy_sql_id')
      .lean();
    const attendances = await Attendance.find({ event_id: event._id })
      .select('registration_id checkin_time')
      .lean();
    const attendanceMap = new Map(
      attendances.map((item) => [item.registration_id.toString(), item.checkin_time])
    );

    const data = registrations.map((registration) => ({
      id: getPublicId(registration, req),
      mongo_id: registration._id.toString(),
      registration_id: getPublicId(registration, req),
      registration_mongo_id: registration._id.toString(),
      registration_status: registration.status,
      status:
        registration.status === REGISTRATION_STATUS.ATTENDED
          ? 'checked_in'
          : registration.status,
      registered_at: registration.registered_at,
      avatar: registration.user_id?.avatar || null,
      checkin_time: attendanceMap.get(registration._id.toString()) || null,
      check_in_time: attendanceMap.get(registration._id.toString()) || null,
      student_name: registration.user_id?.full_name || null,
      full_name: registration.user_id?.full_name || null,
      email: registration.user_id?.email || null,
      student_code: registration.user_id?.student_code || null,
      user_id: registration.user_id?.legacy_sql_id ?? registration.user_id?._id?.toString() ?? null,
      user_mongo_id: registration.user_id?._id?.toString() || null,
      event_id: event.legacy_sql_id ?? event._id.toString(),
      event_mongo_id: event._id.toString(),
      event_title: registration.event_id?.title || event.title,
    }));

    return successResponse(res, 200, 'Lấy danh sách đăng ký thành công', data);
  } catch (error) {
    next(error);
  }
};

const getOrganizerEvents = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50); // Giới hạn tối đa 50 item để đảm bảo tốc độ
    const search = String(req.query.search || '').trim();
    
    const filter = req.user.role === 'admin' ? { is_active: true } : { created_by: req.user.id, is_active: true };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const { data, total } = await listEventsWithCounts(
      req,
      filter,
      { createdAt: -1 },
      page,
      limit
    );

    return paginatedSuccessResponse(res, 200, 'Lấy danh sách sự kiện của nhà tổ chức thành công', data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id));
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    if (req.user.role !== 'admin' && event.created_by.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền truy cập sự kiện này');
    }

    [
      'title',
      'description',
      'location',
      'start_time',
      'end_time',
      'max_participants',
      'is_active',
      'category_id',
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    if (req.body.images !== undefined) {
      event.images = Array.isArray(req.body.images) ? req.body.images : [];
    }

    await event.save();

    const populatedEvent = await Event.findById(event._id).populate(eventPopulate).lean();
    const countMaps = await buildCountMaps([event._id]);
    return successResponse(
      res,
      200,
      'Cập nhật sự kiện thành công',
      serializeEvent(populatedEvent, req, countMaps)
    );
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne(buildLegacyOrObjectIdQuery(req.params.id));
    if (!event) {
      return errorResponse(res, 404, 'Không tìm thấy sự kiện');
    }

    if (req.user.role !== 'admin' && event.created_by.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Bạn không có quyền truy cập sự kiện này');
    }

    event.is_active = false;
    await event.save();

    return successResponse(res, 200, 'Xóa sự kiện thành công', {
      id: getPublicId(event, req),
      mongo_id: event._id.toString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  cancelRegistration,
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getEventRegistrations,
  getOrganizerEvents,
  registerForEvent,
  updateEvent,
};
