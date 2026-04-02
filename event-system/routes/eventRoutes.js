const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const {
  createEventValidation,
  registerForEventValidation,
} = require('../middlewares/validators/eventValidator');
const {
  cancelRegistration,
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  getEventRegistrations,
  getOrganizerEvents,
  registerForEvent,
  updateEvent,
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/organizer/events', auth, authorizeRoles('admin', 'organizer'), getOrganizerEvents);
router.get('/:id', validateId('id'), getEventById);
router.post('/', auth, authorizeRoles('admin', 'organizer'), createEventValidation, createEvent);
router.put('/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), createEventValidation, updateEvent);
router.delete('/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), deleteEvent);
router.post(
  '/:id/register',
  validateId('id'),
  auth,
  authorizeRoles('student', 'admin', 'organizer'),
  registerForEventValidation,
  registerForEvent
);
router.delete(
  '/:id/register',
  validateId('id'),
  auth,
  authorizeRoles('student', 'admin', 'organizer'),
  cancelRegistration
);
router.get(
  '/:id/registrations',
  validateId('id'),
  auth,
  authorizeRoles('admin', 'organizer'),
  getEventRegistrations
);

module.exports = router;
