const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(mongoUri, {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '20', 10),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '5', 10),
    maxIdleTimeMS: 60000,
    serverSelectionTimeoutMS: 15000,
  });

  isConnected = true;
  logger.info('MongoDB connected', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });

  return mongoose.connection;
};

module.exports = {
  connectDB,
  mongoose,
};

