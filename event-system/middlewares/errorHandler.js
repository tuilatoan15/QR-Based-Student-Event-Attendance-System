const { errorResponse } = require('../utils/response');
const { logError } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logError('Unhandled error', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';
  return errorResponse(res, status, message);
};

module.exports = errorHandler;

