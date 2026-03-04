const express = require('express');
const auth = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEventSoft
} = require('../controllers/event.controller');

const router = express.Router();

router.post('/', auth, authorizeRoles('admin', 'organizer'), createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.put('/:id', auth, authorizeRoles('admin', 'organizer'), updateEvent);
router.delete('/:id', auth, authorizeRoles('admin', 'organizer'), deleteEventSoft);

module.exports = router;

