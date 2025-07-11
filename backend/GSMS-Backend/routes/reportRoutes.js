const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const reportController = require('../controllers/reports');

// All routes require authentication
router.use(verifyToken);

// Get report data (JSON)
router.get('/:reportType', 
    checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']), 
    async (req, res, next) => {
        try {
            const { reportType } = req.params;
            const filters = req.query;
            
            const reportData = await reportController.generateReport(reportType, filters);
            res.json(reportData);
        } catch (error) {
            next(error);
        }
    }
);

// Export to Excel
router.get('/export/excel', 
    checkRole(['ADMIN', 'MANAGER']),
    async (req, res, next) => {
        try {
            const { reportType, ...filters } = req.query;
            
            if (!reportType) {
                return res.status(400).json({ error: 'Report type is required' });
            }
            
            const buffer = await reportController.exportToExcel(reportType, filters);
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
            
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
);

// Export to PDF
router.get('/export/pdf', 
    checkRole(['ADMIN', 'MANAGER']),
    async (req, res, next) => {
        try {
            const { reportType, ...filters } = req.query;
            
            if (!reportType) {
                return res.status(400).json({ error: 'Report type is required' });
            }
            
            const buffer = await reportController.exportToPDF(reportType, filters);
            
            // Set headers for file download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
            
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
);

// Generate and save report to server
router.post('/generate', 
    checkRole(['ADMIN', 'MANAGER']),
    async (req, res, next) => {
        try {
            const { reportType, format = 'pdf', ...filters } = req.body;
            
            if (!reportType) {
                return res.status(400).json({ error: 'Report type is required' });
            }
            
            const result = await reportController.generateAndSaveReport(reportType, format, filters);
            
            res.json({
                success: true,
                message: 'Report generated successfully',
                filePath: result.filePath,
                fileName: result.fileName
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get list of available reports
router.get('/', 
    checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
    (req, res) => {
        res.json({
            reports: [
                {
                    type: reportController.REPORT_TYPES.FABRIC_USAGE,
                    name: 'Fabric Usage Report',
                    description: 'Detailed report of fabric usage across orders',
                    availableFormats: [reportController.EXPORT_FORMATS.EXCEL, reportController.EXPORT_FORMATS.PDF]
                },
                {
                    type: reportController.REPORT_TYPES.STOCK_BALANCE,
                    name: 'Stock Balance Report',
                    description: 'Current stock levels and inventory status',
                    availableFormats: [reportController.EXPORT_FORMATS.EXCEL, reportController.EXPORT_FORMATS.PDF]
                },
                {
                    type: reportController.REPORT_TYPES.ORDER_FULFILLMENT,
                    name: 'Order Fulfillment Report',
                    description: 'Status and progress of order fulfillment',
                    availableFormats: [reportController.EXPORT_FORMATS.EXCEL, reportController.EXPORT_FORMATS.PDF]
                },
                {
                    type: reportController.REPORT_TYPES.WASTAGE_ANALYSIS,
                    name: 'Wastage Analysis Report',
                    description: 'Analysis of material wastage and efficiency',
                    availableFormats: [reportController.EXPORT_FORMATS.EXCEL, reportController.EXPORT_FORMATS.PDF]
                }
            ]
        });
    }
);

module.exports = router;