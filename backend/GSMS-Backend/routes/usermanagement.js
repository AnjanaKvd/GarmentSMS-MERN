const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword
} = require('../controllers/userController');

// Protected routes
router.post('/users', verifyToken, checkRole('ADMIN'), createUser);
router.get('/users', verifyToken, checkRole('ADMIN'), getAllUsers);
router.get('/users/:id', verifyToken, checkRole('ADMIN'), getUserById);
router.patch('/users/:id', verifyToken, checkRole('ADMIN'), updateUser);
router.delete('/users/:id', verifyToken, checkRole('ADMIN'), deleteUser);
router.patch('/users/:id/password', verifyToken, checkRole('ADMIN'), changePassword);

module.exports = router;
