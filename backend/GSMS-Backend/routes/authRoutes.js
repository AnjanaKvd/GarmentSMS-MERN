const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/register', verifyToken, checkRole('ADMIN'), authController.register);
router.get('/users', verifyToken, checkRole('ADMIN'), authController.getAllUsers);

module.exports = router; 