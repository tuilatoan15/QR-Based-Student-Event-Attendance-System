const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { checkIn } = require('../controllers/attendanceController');

const router = express.Router();

router.post('/checkin', auth, authorizeRoles('admin', 'organizer'), checkIn);

module.exports = router;
