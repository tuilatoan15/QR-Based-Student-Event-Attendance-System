const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter };
