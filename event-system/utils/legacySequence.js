const getCollectionName = (sequenceName) => {
  const explicitMap = {
    users: 'users',
    events: 'events',
    registrations: 'registrations',
    attendances: 'attendances',
    notifications: 'notifications',
    event_categories: 'event_categories',
  };

  return explicitMap[sequenceName] || sequenceName;
};

const nextLegacySqlId = async (db, sequenceName) => {
  if (!db) {
    throw new Error('Database connection is required for legacy sequence generation');
  }

  const counters = db.collection('counters');
  const collectionName = getCollectionName(sequenceName);
  const latestDoc = await db
    .collection(collectionName)
    .find({ legacy_sql_id: { $type: 'number' } })
    .sort({ legacy_sql_id: -1 })
    .limit(1)
    .next();
  const latestLegacySqlId = latestDoc?.legacy_sql_id ?? 0;
  const existingCounter = await counters.findOne({ _id: sequenceName });

  if (!existingCounter || (existingCounter.seq ?? 0) < latestLegacySqlId) {
    await counters.updateOne(
      { _id: sequenceName },
      { $set: { seq: latestLegacySqlId } },
      { upsert: true }
    );
  }

  const result = await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );

  // MongoDB driver v6 (Mongoose 8) returns the document directly, not { value: doc }
  return result?.seq ?? 1;
};

module.exports = {
  nextLegacySqlId,
};
