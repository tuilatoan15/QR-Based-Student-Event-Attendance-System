const { errorResponse } = require('../utils/response');
const { logError } = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logError('Unhandled error', err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return errorResponse(res, status, message);
};

module.exports = errorMiddleware;
