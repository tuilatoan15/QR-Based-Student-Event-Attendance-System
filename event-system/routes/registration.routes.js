const express = require('express');
const auth = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const {
  registerForEvent,
  getMyRegistrations,
  getRegistrationsByEvent
} = require('../controllers/registration.controller');

const router = express.Router();

router.post('/', auth, authorizeRoles('student', 'admin', 'organizer'), registerForEvent);
router.get('/my', auth, getMyRegistrations);
router.get('/event/:eventId', auth, authorizeRoles('admin'), getRegistrationsByEvent);

module.exports = router;

