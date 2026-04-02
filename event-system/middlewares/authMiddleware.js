const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Tiêu đề xác thực bị thiếu hoặc không hợp lệ');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (_error) {
    return errorResponse(res, 401, 'Token không hợp lệ hoặc đã hết hạn');
  }
};

module.exports = auth;
