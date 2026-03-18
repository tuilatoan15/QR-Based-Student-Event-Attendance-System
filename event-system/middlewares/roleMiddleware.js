const { errorResponse } = require('../utils/response');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, 'Unauthorized');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Không đủ quyền truy cập để thực hiện thao tác này');
    }
    next();
  };
};

module.exports = authorizeRoles;
