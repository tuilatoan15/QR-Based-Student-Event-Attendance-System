const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');

/**
 * Report (Bug report & Feedback) Routes
 */

// User routes (student or any authenticated user)
router.post('/', auth, reportController.createReport);
router.get('/me', auth, reportController.getMyReports);

// Admin routes
router.get('/', auth, authorizeRoles('admin'), reportController.getAllReports);
router.patch('/:id/reply', auth, authorizeRoles('admin'), reportController.replyToReport);

module.exports = router;
