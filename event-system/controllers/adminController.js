const User = require('../models/userModel');
const { successResponse, errorResponse } = require('../utils/response');

const getOrganizers = async (req, res, next) => {
  try {
    const status = String(req.query.status || '').trim().toLowerCase();
    const filter = status ? { approval_status: status } : {};
    const organizerInfos = await req.app.locals.db.collection('organizer_infos').find(filter).toArray();

    const userIds = organizerInfos.map((item) => item.user_id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('full_name email avatar');
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const data = organizerInfos.map((info) => {
      const user = userMap.get(String(info.user_id || ''));
      return {
        user_id: String(info.user_id || ''),
        full_name: user?.full_name || info.full_name || '',
        email: user?.email || info.email || '',
        avatar: user?.avatar || null,
        organization_name: info.organization_name || '',
        position: info.position || null,
        phone: info.phone || null,
        bio: info.bio || null,
        website: info.website || null,
        approval_status: info.approval_status || 'pending',
        reject_reason: info.reject_reason || null,
        created_at: info.created_at || null,
      };
    });

    return successResponse(res, 200, 'Organizers retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

const approveOrganizer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await req.app.locals.db.collection('organizer_infos').updateOne(
      { user_id: user._id },
      {
        $set: {
          user_id: user._id,
          approval_status: 'approved',
          reject_reason: null,
          approved_by: req.user.id,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    user.role = 'organizer';
    await user.save();

    return successResponse(res, 200, 'Organizer approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectOrganizer = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim();
    if (!reason) {
      return errorResponse(res, 400, 'reason is required');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await req.app.locals.db.collection('organizer_infos').updateOne(
      { user_id: user._id },
      {
        $set: {
          user_id: user._id,
          full_name: user.full_name,
          email: user.email,
          approval_status: 'rejected',
          reject_reason: reason,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    // Delete the user account as requested
    await User.findByIdAndDelete(user._id);

    return successResponse(res, 200, 'Tài khoản đã bị từ chối và xóa thông tin đăng nhập thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveOrganizer,
  getOrganizers,
  rejectOrganizer,
};
