const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventRegistrations,
  getEventAttendances
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEventById);

router.post('/:id/register', auth, authorizeRoles('student'), registerForEvent);
router.get('/:id/registrations', auth, authorizeRoles('admin', 'organizer'), getEventRegistrations);
router.get('/:id/attendances', auth, authorizeRoles('admin', 'organizer'), getEventAttendances);

router.post('/', auth, authorizeRoles('admin', 'organizer'), createEvent);
router.put('/:id', auth, authorizeRoles('admin', 'organizer'), updateEvent);
router.delete('/:id', auth, authorizeRoles('admin', 'organizer'), deleteEvent);

module.exports = router;
