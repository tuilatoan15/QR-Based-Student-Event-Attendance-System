const { errorResponse } = require('../utils/response');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, 'Unauthorized');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden: insufficient permissions');
    }
    next();
  };
};

module.exports = authorizeRoles;
