const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { getUserEvents } = require('../controllers/eventController');

const router = express.Router();

router.get('/me/events', auth, getUserEvents);

module.exports = router;
