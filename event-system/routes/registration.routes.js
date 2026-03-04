const express = require('express');
const auth = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const {
  registerForEvent,
  getMyRegistrations,
  getRegistrationsByEvent
} = require('../controllers/registration.controller');

const router = express.Router();

// Đăng ký event: POST /api/events/:id/register
router.post('/:id/register', auth, authorizeRoles('student', 'admin', 'organizer'), registerForEvent);

// Các API phụ (nếu cần) sẽ trở thành:
// GET /api/events/my  -> danh sách event đã đăng ký của current user
router.get('/my', auth, getMyRegistrations);
// GET /api/events/event/:eventId -> admin xem danh sách registration theo event
router.get('/event/:eventId', auth, authorizeRoles('admin'), getRegistrationsByEvent);

module.exports = router;

