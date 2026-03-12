const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const { scanQr, getEventAttendance, getEventAttendanceStats } = require('../controllers/attendanceController');
const { listAttendanceHandler, manualCheckinHandler } = require('../controllers/adminController');

const router = express.Router();

router.post('/scan-qr', auth, authorizeRoles('admin', 'organizer'), scanQr);
router.get('/event/:id', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventAttendance);
router.get('/event/:id/stats', validateId('id'), auth, authorizeRoles('admin', 'organizer'), getEventAttendanceStats);
router.get('/', auth, authorizeRoles('admin', 'organizer'), listAttendanceHandler);
router.post('/manual-checkin', auth, authorizeRoles('admin', 'organizer'), manualCheckinHandler);

module.exports = router;
