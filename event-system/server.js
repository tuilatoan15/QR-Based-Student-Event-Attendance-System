const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const { poolPromise } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Test DB connection on startup
poolPromise
  .then(() => {
    console.log('SQL Server connected');
  })
  .catch((err) => {
    console.error('SQL Server connection error:', err.message || err);
  });

app.get('/', (req, res) => {
  res.json({ message: 'Smart Event Attendance System API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

