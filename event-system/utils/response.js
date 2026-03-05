const successResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const paginatedSuccessResponse = (res, statusCode, message, data = [], pagination = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  successResponse,
  paginatedSuccessResponse,
  errorResponse
};
