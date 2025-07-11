// Report controller
const reportController = require('./reportController');

// Export all report-related functionality
module.exports = {
    // Main controller methods
    generateReport: reportController.generateReport,
    exportToExcel: reportController.exportToExcel,
    exportToPDF: reportController.exportToPDF,
    generateAndSaveReport: reportController.generateAndSaveReport,
    
    // Constants for report types
    REPORT_TYPES: {
        FABRIC_USAGE: 'fabric-usage',
        STOCK_BALANCE: 'stock-balance',
        ORDER_FULFILLMENT: 'order-fulfillment',
        WASTAGE_ANALYSIS: 'wastage-analysis'
    },
    
    // Export formats
    EXPORT_FORMATS: {
        EXCEL: 'excel',
        PDF: 'pdf'
    }
};
