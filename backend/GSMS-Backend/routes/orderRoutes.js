const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Get material usage for an order
router.get('/:id/usage', orderController.getOrderUsage);

// Create new order (Admin and Manager only)
router.post(
  '/',
  checkRole(['ADMIN', 'MANAGER']),
  orderController.createOrder
);

// Update order status (Admin, Manager, Production roles)
router.patch(
  '/:id/status',
  checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
  orderController.updateOrderStatus
);

module.exports = router; 