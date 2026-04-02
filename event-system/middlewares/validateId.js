const { mongoose } = require('../config/db');
const { errorResponse } = require('../utils/response');
const { isLegacyNumericId } = require('../utils/legacyId');

const validateId = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.isValidObjectId(value) && !isLegacyNumericId(value)) {
    return errorResponse(res, 400, `ID ${paramName} không hợp lệ`);
  }

  return next();
};

module.exports = validateId;
