const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const {
  attendanceCheckinValidation,
} = require('../middlewares/validators/eventValidator');
const {
  checkInAttendance,
  getBulkEventStats,
  getEventAttendance,
  getEventAttendanceStats,
  listAttendance,
  manualCheckinByStudent,
} = require('../controllers/attendanceController');

const router = express.Router();

router.post(
  '/check-in',
  auth,
  authorizeRoles('admin', 'organizer'),
  attendanceCheckinValidation,
  checkInAttendance
);
router.post(
  '/scan-qr',
  auth,
  authorizeRoles('admin', 'organizer'),
  attendanceCheckinValidation,
  checkInAttendance
);
router.post('/manual-checkin', auth, authorizeRoles('admin', 'organizer'), manualCheckinByStudent);
router.get('/bulk-stats', auth, authorizeRoles('admin', 'organizer'), getBulkEventStats);
router.get('/', auth, authorizeRoles('admin', 'organizer'), listAttendance);
router.get(
  '/event/:id',
  validateId('id'),
  auth,
  authorizeRoles('admin', 'organizer'),
  getEventAttendance
);
router.get(
  '/event/:id/stats',
  validateId('id'),
  auth,
  authorizeRoles('admin', 'organizer'),
  getEventAttendanceStats
);

module.exports = router;
