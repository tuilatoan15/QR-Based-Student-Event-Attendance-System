const express = require('express');
const { register, registerOrganizer, login, forgotPassword } = require('../controllers/authController');
const {
  registerValidation,
  registerOrganizerValidation,
  loginValidation,
  forgotPasswordValidation,
} = require('../middlewares/validators/authValidator');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/register-organizer', registerOrganizerValidation, registerOrganizer);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);

module.exports = router;
