const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const { scanQr, getEventAttendance } = require('../controllers/attendanceController');

const router = express.Router();

router.post('/scan-qr', auth, authorizeRoles('admin', 'organizer'), scanQr);
router.get('/event/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventAttendance);

module.exports = router;
