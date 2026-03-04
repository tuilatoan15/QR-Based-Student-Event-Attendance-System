const express = require('express');
const auth = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const { checkIn } = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/checkin', auth, authorizeRoles('admin', 'organizer'), checkIn);

module.exports = router;

