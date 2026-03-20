const express = require('express');
const { register, registerOrganizer, login } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middlewares/validators/authValidator');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/register-organizer', registerOrganizer);
router.post('/login', loginValidation, login);

module.exports = router;
