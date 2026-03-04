const express = require('express');
const {
  createEventController,
  getEventsController,
  getEventByIdController
} = require('../controllers/eventController');

const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Create event (admin only)
router.post('/', authMiddleware, authorizeRoles('admin'), createEventController);

// Get all events (public)
router.get('/', getEventsController);

// Get event by id (public)
router.get('/:id', getEventByIdController);

module.exports = router;

