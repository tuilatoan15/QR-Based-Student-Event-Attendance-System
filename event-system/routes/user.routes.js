const express = require('express');
const auth = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUserSoft
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/', auth, authorizeRoles('admin'), getAllUsers);
router.get('/:id', auth, authorizeRoles('admin'), getUserById);
router.put('/:id', auth, authorizeRoles('admin'), updateUser);
router.delete('/:id', auth, authorizeRoles('admin'), deleteUserSoft);

module.exports = router;

