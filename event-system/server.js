const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const { setupSwagger } = require('./docs/swagger');
const { authLimiter } = require('./middlewares/rateLimitMiddleware');
const errorHandler = require('./middlewares/errorHandler');
const { logServerStart } = require('./utils/logger');

require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QR-Based Student Event Attendance API',
    data: null
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

setupSwagger(app);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logServerStart(PORT);
});
