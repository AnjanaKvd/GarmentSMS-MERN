const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get material summary report
router.get('/summary', reportController.getMaterialSummary);

// Get orders report
router.get('/orders', reportController.getOrdersReport);

// Export PDF report
router.get('/download/pdf', reportController.exportPDF);

// Export Excel report
router.get('/download/xlsx', reportController.exportExcel);

module.exports = router; 