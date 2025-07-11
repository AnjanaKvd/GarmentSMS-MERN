const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Import Excel generators
const { addFabricUsageToExcel } = require('./excelGenerators/fabricUsageExcel');
const { addStockBalanceToExcel } = require('./excelGenerators/stockBalanceExcel');
const { addOrderFulfillmentToExcel } = require('./excelGenerators/orderFulfillmentExcel');
const { addWastageAnalysisToExcel } = require('./excelGenerators/wastageAnalysisExcel');

// Import PDF generators
const { addFabricUsageToPDF } = require('./pdfGenerators/fabricUsagePdf');
const { addStockBalanceToPDF } = require('./pdfGenerators/stockBalancePdf');
const { addOrderFulfillmentToPDF } = require('./pdfGenerators/orderFulfillmentPdf');
const { addWastageAnalysisToPDF } = require('./pdfGenerators/wastageAnalysisPdf');

// Import report generators
const { generateFabricUsageReport } = require('./reportGenerators/fabricUsageReport');
const { generateStockBalanceReport } = require('./reportGenerators/stockBalanceReport');
const { generateOrderFulfillmentReport } = require('./reportGenerators/orderFulfillmentReport');
const { generateWastageAnalysisReport } = require('./reportGenerators/wastageAnalysisReport');

// Map report types to their respective generators
const reportGenerators = {
    'fabric-usage': generateFabricUsageReport,
    'stock-balance': generateStockBalanceReport,
    'order-fulfillment': generateOrderFulfillmentReport,
    'wastage-analysis': generateWastageAnalysisReport
};

const excelGenerators = {
    'fabric-usage': addFabricUsageToExcel,
    'stock-balance': addStockBalanceToExcel,
    'order-fulfillment': addOrderFulfillmentToExcel,
    'wastage-analysis': addWastageAnalysisToExcel
};

const pdfGenerators = {
    'fabric-usage': addFabricUsageToPDF,
    'stock-balance': addStockBalanceToPDF,
    'order-fulfillment': addOrderFulfillmentToPDF,
    'wastage-analysis': addWastageAnalysisToPDF
};

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../../../reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Generate a report and return the data
 * @param {string} reportType - Type of report to generate
 * @param {Object} filters - Filters to apply to the report
 * @returns {Promise<Object>} Report data
 */
const generateReport = async (reportType, filters = {}) => {
    const generator = reportGenerators[reportType];
    if (!generator) {
        throw new Error(`Unsupported report type: ${reportType}`);
    }
    
    try {
        const reportData = await generator(filters);
        return reportData;
    } catch (error) {
        console.error(`Error generating ${reportType} report:`, error);
        throw new Error(`Failed to generate ${reportType} report: ${error.message}`);
    }
};

/**
 * Export a report to Excel
 * @param {string} reportType - Type of report to export
 * @param {Object} filters - Filters to apply to the report
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportToExcel = async (reportType, filters = {}) => {
    const generator = excelGenerators[reportType];
    if (!generator) {
        const errorMsg = `Unsupported report type for Excel export: ${reportType}`;
        console.error(`[exportToExcel] ${errorMsg}`);
        throw new Error(errorMsg);
    }
    
    try {
        // Generate the report data
        const reportData = await generateReport(reportType, filters);
        
        // Log report data structure for debugging
        console.log(`[exportToExcel] Report data structure:`, {
            hasSummary: !!reportData.summary,
            materialsCount: reportData.materials?.length || 0,
            filteredMaterialsCount: reportData.filteredMaterials?.length || 0,
            hasTransactions: reportData.materials?.[0]?.transactions?.length > 0 || false,
            sampleMaterial: reportData.materials?.[0] ? {
                name: reportData.materials[0].name,
                itemCode: reportData.materials[0].itemCode,
                transactions: reportData.materials[0].transactions?.length || 0
            } : 'No materials found'
        });
        
        // Create a new workbook
        console.log(`[exportToExcel] Creating new workbook...`);
        const workbook = new ExcelJS.Workbook();
        
        // Add the report to the workbook
        console.log(`[exportToExcel] Adding report to workbook...`);
        await generator(workbook, reportData);
        
        // Generate the Excel file in memory
        console.log(`[exportToExcel] Generating Excel buffer...`);
        const buffer = await workbook.xlsx.writeBuffer();
        
        console.log(`[exportToExcel] Successfully generated Excel buffer (${buffer.byteLength} bytes)`);
        return buffer;
    } catch (error) {
        console.error(`[exportToExcel] Error exporting ${reportType} to Excel:`, error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        throw new Error(`Failed to export ${reportType} to Excel: ${error.message}`);
    }
};

/**
 * Export a report to PDF
 * @param {string} reportType - Type of report to export
 * @param {Object} filters - Filters to apply to the report
 * @returns {Promise<Buffer>} PDF file buffer
 */
const exportToPDF = async (reportType, filters = {}) => {
    const generator = pdfGenerators[reportType];
    if (!generator) {
        throw new Error(`Unsupported report type for PDF export: ${reportType}`);
    }
    
    return new Promise(async (resolve, reject) => {
        try {
            // Generate the report data
            const reportData = await generateReport(reportType, filters);
            
            // Create a new PDF document
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const chunks = [];
            
            // Collect the PDF data
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            
            // Add the report to the PDF
            generator(doc, reportData);
            
            // Finalize the PDF
            doc.end();
        } catch (error) {
            console.error(`Error exporting ${reportType} to PDF:`, error);
            reject(new Error(`Failed to export ${reportType} to PDF: ${error.message}`));
        }
    });
};

/**
 * Generate and save a report to a file
 * @param {string} reportType - Type of report to generate
 * @param {string} format - Output format ('excel' or 'pdf')
 * @param {Object} filters - Filters to apply to the report
 * @returns {Promise<{filePath: string, fileName: string}>} Path and name of the generated file
 */
const generateAndSaveReport = async (reportType, format, filters = {}) => {
    try {
        // Generate the file name
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${reportType}-${timestamp}.${format}`;
        const filePath = path.join(reportsDir, fileName);
        
        let buffer;
        
        // Generate the file in the requested format
        if (format === 'excel') {
            buffer = await exportToExcel(reportType, filters);
        } else if (format === 'pdf') {
            buffer = await exportToPDF(reportType, filters);
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }
        
        // Save the file
        await fs.promises.writeFile(filePath, buffer);
        
        return {
            filePath,
            fileName
        };
    } catch (error) {
        console.error(`Error generating ${reportType} report:`, error);
        throw new Error(`Failed to generate ${reportType} report: ${error.message}`);
    }
};

module.exports = {
    generateReport,
    exportToExcel,
    exportToPDF,
    generateAndSaveReport
};
