const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const { createEventValidation, updateEventValidation } = require('../middlewares/validators/eventValidator');
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
router.get('/:id', validateId('id'), getEventById);

router.post('/:id/register', validateId('id'), auth, authorizeRoles('student'), registerForEvent);
router.get('/:id/registrations', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventRegistrations);
router.get('/:id/attendances', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventAttendances);

router.post('/', auth, authorizeRoles('admin', 'organizer'), createEventValidation, createEvent);
router.put('/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), updateEventValidation, updateEvent);
router.delete('/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), deleteEvent);

module.exports = router;
