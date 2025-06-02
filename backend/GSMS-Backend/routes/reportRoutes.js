const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Fabric usage summary by date/order
router.get('/fabric-usage', reportController.getFabricUsageSummary);

// In-out stock balance
router.get('/stock-balance', reportController.getStockBalance);

// Order fulfillment status
router.get('/order-fulfillment', reportController.getOrderFulfillment);

// Wastage analysis
router.get('/wastage-analysis', reportController.getWastageAnalysis);

// Export to Excel
router.get('/export/excel', reportController.exportToExcel);

// Export to PDF
router.get('/export/pdf', reportController.exportToPDF);

module.exports = router; 