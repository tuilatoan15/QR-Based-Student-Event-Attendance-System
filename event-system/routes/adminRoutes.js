const express = require('express');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validateId = require('../middlewares/validateId');
const {
  approveOrganizer,
  getOrganizers,
  rejectOrganizer,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/organizers', auth, authorizeRoles('admin'), getOrganizers);
router.patch('/organizers/:id/approve', validateId('id'), auth, authorizeRoles('admin'), approveOrganizer);
router.patch('/organizers/:id/reject', validateId('id'), auth, authorizeRoles('admin'), rejectOrganizer);

module.exports = router;
