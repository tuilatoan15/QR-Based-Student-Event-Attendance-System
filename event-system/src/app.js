const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const { setupSwagger } = require('../docs/swagger');
const { authLimiter, apiLimiter } = require('../middlewares/rateLimitMiddleware');
const errorHandler = require('../middlewares/errorHandler');
const { logServerStart } = require('../utils/logger');
const { connectDB } = require('../config/db');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const eventRoutes = require('../routes/eventRoutes');
const attendanceRoutes = require('../routes/attendanceRoutes');
const adminRoutes = require('../routes/adminRoutes');
const reportRoutes = require('../routes/reportRoutes');

const app = express();
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
};

app.use(helmet());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '20mb' }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if (process.env.NODE_ENV !== 'development') {
  app.use('/api', apiLimiter);
}

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'QR-Based Student Event Attendance API running with MongoDB',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', database: 'mongodb' });
});

setupSwagger(app);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

const start = async () => {
  const port = process.env.PORT || 5000;
  const dbConnection = await connectDB();
  app.locals.db = dbConnection.db;
  app.listen(port, () => {
    logServerStart(port);
    console.log(`Server running on port ${port}`);
  });
};

module.exports = {
  app,
  start,
};
