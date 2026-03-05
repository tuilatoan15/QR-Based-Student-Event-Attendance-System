const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'event-attendance-api' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

function logServerStart(port) {
  logger.info('Server start', { port });
}

function logError(message, err) {
  logger.error(message, { error: err?.message, stack: err?.stack });
}

function logAuthAttempt(email, success) {
  logger.info('Auth attempt', { email, success });
}

function logCheckin(registrationId, userId) {
  logger.info('Check-in event', { registrationId, checkedInBy: userId });
}

module.exports = {
  logger,
  logServerStart,
  logError,
  logAuthAttempt,
  logCheckin
};
