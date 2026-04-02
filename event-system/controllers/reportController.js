const { Report, REPORT_STATUS } = require('../models/reportModel');
const User = require('../models/userModel');
const notificationService = require('../services/notificationService');
const { nextLegacySqlId } = require('../utils/legacySequence');
const { successResponse, paginatedSuccessResponse, errorResponse } = require('../utils/response');
const { getPublicId } = require('../utils/clientFormat');

/**
 * Handle bug report & feedback requests.
 */

// User submits a new report
const createReport = async (req, res, next) => {
  try {
    const { type, title, content } = req.body;
    if (!title || !content) {
      return errorResponse(res, 400, 'Vui lòng cung cấp tiêu đề và nội dung');
    }

    const legacy_sql_id = await nextLegacySqlId(req.app.locals.db, 'reports');

    const report = await Report.create({
      legacy_sql_id,
      user_id: req.user.id,
      type: type || 'support',
      title,
      content,
      status: REPORT_STATUS.PENDING,
    });

    return successResponse(res, 201, 'Gửi báo lỗi thành công', {
      id: getPublicId(report, req),
      mongo_id: report._id,
      title: report.title,
      status: report.status,
    });
  } catch (error) {
    next(error);
  }
};

// User gets their own reports
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();

    const data = reports.map((r) => ({
      id: getPublicId(r, req),
      mongo_id: r._id.toString(),
      type: r.type,
      title: r.title,
      content: r.content,
      status: r.status,
      admin_reply: r.admin_reply,
      replied_at: r.replied_at,
      created_at: r.created_at,
    }));

    return successResponse(res, 200, 'Lấy danh sách phản hồi thành công', data);
  } catch (error) {
    next(error);
  }
};

// Admin gets all reports
const getAllReports = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find({})
        .populate('user_id', 'full_name email student_code avatar legacy_sql_id')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments({}),
    ]);

    const data = reports.map((r) => ({
      id: getPublicId(r, req),
      mongo_id: r._id.toString(),
      user: {
        id: r.user_id?.legacy_sql_id ?? r.user_id?._id?.toString(),
        full_name: r.user_id?.full_name,
        email: r.user_id?.email,
        student_code: r.user_id?.student_code,
        avatar: r.user_id?.avatar,
      },
      type: r.type,
      title: r.title,
      content: r.content,
      status: r.status,
      admin_reply: r.admin_reply,
      replied_at: r.replied_at,
      created_at: r.created_at,
    }));

    return paginatedSuccessResponse(res, 200, 'Lấy danh sách báo lỗi thành công', data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// Admin replies to a report
const replyToReport = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      return errorResponse(res, 400, 'Vui lòng nhập nội dung phản hồi');
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return errorResponse(res, 404, 'Không tìm thấy báo lỗi');
    }

    report.admin_reply = reply;
    report.status = REPORT_STATUS.RESPONDED;
    report.replied_at = new Date();
    report.replied_by = req.user.id;
    await report.save();

    // Send notification to the user
    await notificationService.sendNotification(
      req.app.locals.db,
      report.user_id,
      'Phản hồi từ Ban quản trị',
      `Bạn có phản hồi mới cho yêu cầu: "${report.title}"`,
      'feedback',
      null // No associated event_id
    );

    return successResponse(res, 200, 'Gửi phản hồi thành công', {
      id: getPublicId(report, req),
      status: report.status,
      admin_reply: report.admin_reply,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getAllReports,
  replyToReport,
};
