const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { getUserEvents } = require('../controllers/eventController');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const {
  listUsersHandler,
  updateUserRoleHandler,
  deactivateUserHandler
} = require('../controllers/adminController');
const {
  getUserNotifications,
  markNotificationAsRead
} = require('../controllers/userController');

const router = express.Router();

router.get('/me/events', auth, getUserEvents);
router.get('/me/notifications', auth, getUserNotifications);
router.patch('/me/notifications/:id/read', validateId('id'), auth, markNotificationAsRead);

// Admin user management
router.get('/', auth, authorizeRoles('admin'), listUsersHandler);
router.patch('/:id/role', validateId('id'), auth, authorizeRoles('admin'), updateUserRoleHandler);
router.patch('/:id/active', validateId('id'), auth, authorizeRoles('admin'), deactivateUserHandler);

module.exports = router;
