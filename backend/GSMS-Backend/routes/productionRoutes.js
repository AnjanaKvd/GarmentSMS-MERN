const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all production logs
router.get('/', productionController.getAllProductionLogs);

// Get production logs for a specific order
router.get('/order/:orderId', productionController.getProductionLogsByOrder);

// Get wastage analysis
router.get('/wastage-analysis', productionController.getWastageAnalysis);

// Record production and wastage (Production roles)
router.post(
  '/',
  checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
  productionController.recordProduction
);

// Add extra wastage
router.post(
  '/extra-wastage',
  checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
  productionController.addExtraWastage
);

// Update production log (Production roles)
router.patch(
  '/:id',
  checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
  productionController.updateProductionLog
);

// Delete production log (Admin and Manager only)
router.delete(
  '/:id',
  checkRole(['ADMIN', 'MANAGER']),
  productionController.deleteProductionLog
);

module.exports = router; 