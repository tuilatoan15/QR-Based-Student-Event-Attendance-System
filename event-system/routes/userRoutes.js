const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const upload = require('../middlewares/uploadMiddleware');
const {
  changePassword,
  getOrganizerProfile,
  getMyEvents,
  getMyNotifications,
  listUsers,
  markAllNotificationsRead,
  markNotificationRead,
  setActive,
  updateMyAvatar,
  updateOrganizerProfile,
  updateRole,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', auth, authorizeRoles('admin'), listUsers);
router.patch('/:id/role', validateId('id'), auth, authorizeRoles('admin'), updateRole);
router.patch('/:id/active', validateId('id'), auth, authorizeRoles('admin'), setActive);
router.get('/me/events', auth, authorizeRoles('student', 'organizer', 'admin'), getMyEvents);
router.get('/me/notifications', auth, authorizeRoles('student', 'organizer', 'admin'), getMyNotifications);
router.patch('/me/notifications/read-all', auth, authorizeRoles('student', 'organizer', 'admin'), markAllNotificationsRead);
router.patch('/me/notifications/:id/read', validateId('id'), auth, authorizeRoles('student', 'organizer', 'admin'), markNotificationRead);
router.patch('/me/password', auth, authorizeRoles('student', 'organizer', 'admin'), changePassword);
router.patch('/me/avatar', auth, authorizeRoles('student', 'organizer', 'admin'), upload.single('avatar'), updateMyAvatar);
router.post('/me/avatar', auth, authorizeRoles('student', 'organizer', 'admin'), upload.single('avatar'), updateMyAvatar);
router.get('/me/organizer-profile', auth, authorizeRoles('organizer', 'admin'), getOrganizerProfile);
router.patch('/me/organizer-profile', auth, authorizeRoles('organizer', 'admin'), updateOrganizerProfile);

module.exports = router;
