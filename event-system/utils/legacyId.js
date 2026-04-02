const { mongoose } = require('../config/db');

const isLegacyNumericId = (value) => /^\d+$/.test(String(value || '').trim());

const buildLegacyOrObjectIdQuery = (id) => {
  const raw = String(id || '').trim();

  if (mongoose.isValidObjectId(raw)) {
    return { _id: raw };
  }

  if (isLegacyNumericId(raw)) {
    return { legacy_sql_id: Number(raw) };
  }

  return null;
};

module.exports = {
  isLegacyNumericId,
  buildLegacyOrObjectIdQuery,
};
