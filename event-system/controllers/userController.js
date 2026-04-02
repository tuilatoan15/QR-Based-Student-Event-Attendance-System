const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { mongoose } = require('../config/db');
const Event = require('../models/eventModel');
const { Registration, REGISTRATION_STATUS } = require('../models/registrationModel');
const Attendance = require('../models/attendanceModel');
const { getPublicId } = require('../utils/clientFormat');
const { successResponse, paginatedSuccessResponse, errorResponse } = require('../utils/response');

const getOrganizerCollection = (req) => req.app.locals.db.collection('organizer_infos');
const getNotificationsCollection = (req) => req.app.locals.db.collection('notifications');

const buildOrganizerProfilePayload = (user, organizerInfo = null) => {
  const profile = organizerInfo || user.organizer_profile || {};

  return {
    id: user.legacy_sql_id ?? user._id.toString(),
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    organization_name: profile.organization_name || '',
    position: profile.position || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    website: profile.website || '',
    approval_status: profile.approval_status || 'pending',
    reject_reason: profile.reject_reason || null,
    organizer_profile: user.organizer_profile || null,
  };
};

const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { student_code: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const data = users.map((user) => ({
      id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      student_code: user.student_code,
      is_active: user.is_active,
      role_name: user.role,
      role: user.role,
      avatar: user.avatar || null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }));

    return paginatedSuccessResponse(res, 200, 'Lấy danh sách người dùng thành công', data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'organizer', 'student'].includes(role)) {
      return errorResponse(res, 400, 'Vai trò không hợp lệ');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'Không tìm thấy người dùng');
    }

    user.role = role;
    if (role === 'organizer' && !user.organizer_profile) {
      user.organizer_profile = {};
    }
    await user.save();

    if (role === 'organizer') {
      await getOrganizerCollection(req).updateOne(
        { user_id: user._id },
        {
          $setOnInsert: {
            user_id: user._id,
            approval_status: 'approved',
            created_at: new Date(),
          },
          $set: {
            updated_at: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return successResponse(res, 200, 'Cập nhật vai trò thành công', {
      id: user._id.toString(),
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

const setActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    user.is_active = Boolean(req.body.is_active);
    await user.save();

    return successResponse(res, 200, 'Cập nhật trạng thái người dùng thành công', {
      id: user._id.toString(),
      is_active: user.is_active,
    });
  } catch (error) {
    next(error);
  }
};

const getOrganizerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const organizerInfo = await getOrganizerCollection(req).findOne({ user_id: user._id });

    return successResponse(
      res,
      200,
      'Lấy thông tin nhà tổ chức thành công',
      buildOrganizerProfilePayload(user, organizerInfo)
    );
  } catch (error) {
    next(error);
  }
};

const updateOrganizerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const allowedFields = ['organization_name', 'position', 'phone', 'bio', 'website'];
    const profile = { ...(user.organizer_profile || {}) };

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    if (req.body.full_name !== undefined) {
      user.full_name = req.body.full_name;
    }

    user.organizer_profile = profile;
    if (user.role !== 'organizer') {
      user.role = 'organizer';
    }
    await user.save();

    await getOrganizerCollection(req).updateOne(
      { user_id: user._id },
      {
        $set: {
          user_id: user._id,
          organization_name: profile.organization_name || null,
          position: profile.position || null,
          phone: profile.phone || null,
          bio: profile.bio || null,
          website: profile.website || null,
          updated_at: new Date(),
        },
        $setOnInsert: {
          approval_status: 'pending',
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    const organizerInfo = await getOrganizerCollection(req).findOne({ user_id: user._id });

    return successResponse(
      res,
      200,
      'Cập nhật thông tin nhà tổ chức thành công',
      buildOrganizerProfilePayload(user, organizerInfo)
    );
  } catch (error) {
    next(error);
  }
};

const updateMyAvatar = async (req, res, next) => {
  try {
    let avatarUrl = '';
    
    // Check if file was uploaded via Multer/Cloudinary
    if (req.file && req.file.path) {
      avatarUrl = req.file.path;
    } 
    // Otherwise check for URL string in body
    else if (req.body.avatar) {
      avatarUrl = typeof req.body.avatar === 'string' ? req.body.avatar.trim() : '';
    }

    if (!avatarUrl) {
      return errorResponse(res, 400, 'Yêu cầu cung cấp ảnh đại diện (file hoặc URL)');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    user.avatar = avatarUrl;
    await user.save();

    return successResponse(res, 200, 'Cập nhật ảnh đại diện thành công', {
      id: getPublicId(user, req),
      avatar: user.avatar,
      secure_url: user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id).select('_id legacy_sql_id').lean();
    if (!currentUser) {
      return errorResponse(res, 404, 'User not found');
    }

    const registrations = await Registration.find({
      user_id: req.user.id,
      status: { $ne: REGISTRATION_STATUS.CANCELLED },
    })
      .populate('event_id')
      .lean();

    const attendanceMap = new Map(
      (
        await Attendance.find({
          registration_id: { $in: registrations.map((item) => item._id) },
        })
          .select('registration_id checkin_time')
          .lean()
      ).map((item) => [item.registration_id.toString(), item])
    );

    const data = registrations
      .filter((item) => item.event_id)
      .map((registration) => ({
        id: registration.event_id.legacy_sql_id ?? registration.event_id._id.toString(),
        mongo_id: registration.event_id._id.toString(),
        title: registration.event_id.title,
        description: registration.event_id.description,
        location: registration.event_id.location,
        start_time: registration.event_id.start_time,
        end_time: registration.event_id.end_time,
        max_participants: registration.event_id.max_participants,
        images: registration.event_id.images || [],
        registered_count: registration.registration_count ?? null,
        checked_in_count: null,
        registration: {
          id: getPublicId(registration, req),
          mongo_id: registration._id.toString(),
          user_id: currentUser.legacy_sql_id ?? currentUser._id.toString(),
          event_id: registration.event_id.legacy_sql_id ?? registration.event_id._id.toString(),
          qr_token: registration.qr_token,
          status: registration.status,
          registered_at: registration.registered_at,
          check_in_time:
            attendanceMap.get(registration._id.toString())?.checkin_time || null,
        },
        qr_code: registration.qr_token,
      }));

    return successResponse(res, 200, 'Lấy danh sách sự kiện của tôi thành công', data);
  } catch (error) {
    next(error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const items = await getNotificationsCollection(req)
      .find({ user_id: new mongoose.Types.ObjectId(req.user.id) })
      .sort({ created_at: -1 })
      .toArray();

    const rawEventIds = items
      .map((item) => item.event_id)
      .filter((value) => mongoose.Types.ObjectId.isValid(value))
      .map((value) => new mongoose.Types.ObjectId(value));
    const eventDocs = rawEventIds.length
      ? await Event.find({ _id: { $in: rawEventIds } }).select('_id legacy_sql_id').lean()
      : [];
    const eventIdMap = new Map(
      eventDocs.map((event) => [event._id.toString(), event.legacy_sql_id ?? event._id.toString()])
    );

    const data = items.map((item) => ({
      id: item.legacy_sql_id ?? item._id.toString(),
      mongo_id: item._id.toString(),
      title: item.title,
      message: item.message,
      is_read: Boolean(item.is_read),
      created_at: item.created_at || new Date().toISOString(),
      type: item.type || null,
      event_id:
        item.event_id && eventIdMap.has(item.event_id.toString())
          ? eventIdMap.get(item.event_id.toString())
          : item.event_id || null,
    }));

    return successResponse(res, 200, 'Lấy danh sách thông báo thành công', data);
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const numericId = Number(req.params.id);
    const notificationFilter = {
      user_id: new mongoose.Types.ObjectId(req.user.id),
      $or: [],
    };

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      notificationFilter.$or.push({ _id: new mongoose.Types.ObjectId(req.params.id) });
    }

    if (!Number.isNaN(numericId)) {
      notificationFilter.$or.push({ legacy_sql_id: numericId });
    }

    if (!notificationFilter.$or.length) {
      return errorResponse(res, 400, 'ID thông báo không hợp lệ');
    }

    const result = await getNotificationsCollection(req).findOneAndUpdate(
      notificationFilter,
      { $set: { is_read: true } },
      { returnDocument: 'after' }
    );

    // MongoDB driver v6 (Mongoose 8) returns the document directly, not wrapped in .value
    if (!result) {
      return errorResponse(res, 404, 'Không tìm thấy thông báo');
    }

    return successResponse(res, 200, 'Đã đánh dấu thông báo là đã đọc');
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    await getNotificationsCollection(req).updateMany(
      { user_id: new mongoose.Types.ObjectId(req.user.id), is_read: { $ne: true } },
      { $set: { is_read: true } }
    );

    return successResponse(res, 200, 'Đã đánh dấu tất cả thông báo là đã đọc');
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return errorResponse(res, 400, 'Yêu cầu nhập mật khẩu cũ và mới');
    }

    const user = await User.findById(req.user.id).select('+password_hash');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    const matches = await bcrypt.compare(old_password, user.password_hash);
    if (!matches) {
      return errorResponse(res, 400, 'Mật khẩu cũ không chính xác');
    }

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    return successResponse(res, 200, 'Cập nhật mật khẩu thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  changePassword,
  getOrganizerProfile,
  getMyEvents,
  getMyNotifications,
  listUsers,
  markAllNotificationsRead,
  markNotificationRead,
  setActive,
  updateMyAvatar,
  updateOrganizerProfile,
  updateRole,
};
