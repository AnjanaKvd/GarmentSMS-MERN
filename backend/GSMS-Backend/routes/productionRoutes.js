const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get production logs by order ID
router.get('/:orderId', productionController.getProductionLogsByOrder);

// Get production summary for an order
router.get('/:orderId/summary', productionController.getProductionSummary);

// Create production log (Admin, Manager, Production roles)
router.post(
  '/',
  checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
  productionController.createProductionLog
);

module.exports = router; 