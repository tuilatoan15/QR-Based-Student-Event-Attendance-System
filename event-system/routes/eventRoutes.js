const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const { createEventValidation, updateEventValidation } = require('../middlewares/validators/eventValidator');
const { uploadEventImages } = require('../middlewares/uploadEventImages');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
  getOrganizerEvents,
  getEventParticipants
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', validateId('id'), getEventById);

router.post('/:id/register', validateId('id'), auth, authorizeRoles('student'), registerForEvent);
router.delete('/:id/register', validateId('id'), auth, authorizeRoles('student'), cancelRegistration);
router.get('/:id/registrations', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventParticipants);

// Event members routes (alternative API structure)
router.post('/register-event', auth, authorizeRoles('student'), (req, res, next) => {
  // For this route, event_id should be in the request body
  req.params.id = req.body.event_id;
  return registerForEvent(req, res, next);
});
router.get('/event/:id/members', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventRegistrations);

router.get('/organizer/events', auth, authorizeRoles('admin', 'organizer'), getOrganizerEvents);
router.post('/', auth, authorizeRoles('admin', 'organizer'), uploadEventImages, createEventValidation, createEvent);
router.put('/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), uploadEventImages, updateEventValidation, updateEvent);
router.delete('/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), deleteEvent);

module.exports = router;
