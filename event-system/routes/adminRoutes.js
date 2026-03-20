const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');

const {
  getPendingOrganizersHandler,
  approveOrganizerHandler,
  rejectOrganizerHandler
} = require('../controllers/adminController');

const router = express.Router();

router.get('/organizers', auth, authorizeRoles('admin'), getPendingOrganizersHandler);
router.patch('/organizers/:id/approve', validateId('id'), auth, authorizeRoles('admin'), approveOrganizerHandler);
router.patch('/organizers/:id/reject', validateId('id'), auth, authorizeRoles('admin'), rejectOrganizerHandler);

module.exports = router;
