const express = require('express');
const {
  registerForEventController,
  getMyEventsController,
  checkInController
} = require('../controllers/registrationController');

const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Student event registration
router.post('/', authMiddleware, authorizeRoles('student'), registerForEventController);

// Student's registered events
router.get('/my-events', authMiddleware, authorizeRoles('student'), getMyEventsController);

// Admin QR check-in
router.post('/check-in', authMiddleware, authorizeRoles('admin'), checkInController);

module.exports = router;

