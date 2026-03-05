const { errorResponse } = require('../utils/response');

const validateId = (paramName = 'id') => (req, res, next) => {
  const raw = req.params[paramName];
  const id = parseInt(raw, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return errorResponse(res, 400, `Invalid ${paramName}`);
  }

  req.params[paramName] = id;
  return next();
};

module.exports = validateId;

