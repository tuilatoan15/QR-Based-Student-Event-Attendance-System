const isMobileClient = (req) =>
  String(req.headers['x-client'] || '').trim().toLowerCase() === 'mobile-app';

const getPublicId = (doc, req) => {
  if (!doc) {
    return null;
  }

  if (isMobileClient(req) && doc.legacy_sql_id != null) {
    return doc.legacy_sql_id;
  }

  if (doc._id && typeof doc._id.toString === 'function') {
    return doc._id.toString();
  }

  return doc.id ?? null;
};

module.exports = {
  getPublicId,
  isMobileClient,
};
