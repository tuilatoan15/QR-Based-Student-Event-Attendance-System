const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Student registration
router.post('/register', register);

// Login (both admin and student)
router.post('/login', login);

module.exports = router;

