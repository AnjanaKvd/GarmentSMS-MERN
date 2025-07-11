const ExcelJS = require('exceljs');

async function addWastageAnalysisToExcel(workbook, reportData) {
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Wastage Analysis Summary');
    
    // Add title
    summarySheet.getCell('A1').value = 'Wastage Analysis Report';
    summarySheet.getCell('A1').font = { bold: true, size: 14 };
    
    // Add date range if available
    if (reportData.summary.startDate || reportData.summary.endDate) {
        const dateRange = [
            reportData.summary.startDate ? `From: ${new Date(reportData.summary.startDate).toLocaleDateString()}` : '',
            reportData.summary.endDate ? `To: ${new Date(reportData.summary.endDate).toLocaleDateString()}` : ''
        ].filter(Boolean).join(' ');
        
        summarySheet.getCell('A2').value = dateRange;
    }
    
    // Add summary data
    summarySheet.addRow(['Total Items', reportData.summary.totalItems]);
    summarySheet.addRow(['Total Wastage', reportData.summary.totalWastage]);
    summarySheet.addRow(['Average Wastage %', reportData.summary.averageWastagePercentage + '%']);
    
    // Add a blank row
    summarySheet.addRow([]);
    
    // Add wastage by material header
    const headers = [
        'Item Code',
        'Material Name',
        'Unit',
        'Total Used',
        'Standard Wastage',
        'Extra Wastage',
        'Total Wastage',
        'Wastage %',
        'Status'
    ];
    
    const headerRow = summarySheet.addRow(headers);
    headerRow.font = { bold: true };
    
    // Add wastage data
    reportData.materials.forEach(item => {
        summarySheet.addRow([
            item.itemCode,
            item.name,
            item.unit,
            item.totalUsed,
            item.standardWastage,
            item.extraWastage,
            item.totalWastage,
            item.wastagePercentage / 100, // Convert to decimal for Excel percentage format
            item.status
        ]);
    });
    
    // Format columns
    summarySheet.columns = [
        { header: 'Item Code', key: 'itemCode', width: 15 },
        { header: 'Material Name', key: 'name', width: 30 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Total Used', key: 'totalUsed', width: 15, style: { numFmt: '0.00' } },
        { header: 'Standard Wastage', key: 'standardWastage', width: 15, style: { numFmt: '0.00' } },
        { header: 'Extra Wastage', key: 'extraWastage', width: 15, style: { numFmt: '0.00' } },
        { header: 'Total Wastage', key: 'totalWastage', width: 15, style: { numFmt: '0.00' } },
        { header: 'Wastage %', key: 'wastagePercentage', width: 12, style: { numFmt: '0.00%' } },
        { header: 'Status', key: 'status', width: 15 }
    ];
    
    // Add a sheet for wastage reasons
    if (reportData.wastageReasons && reportData.wastageReasons.length > 0) {
        const reasonsSheet = workbook.addWorksheet('Wastage Reasons');
        
        // Add title
        reasonsSheet.getCell('A1').value = 'Wastage Reasons';
        reasonsSheet.getCell('A1').font = { bold: true, size: 14 };
        
        // Add headers
        reasonsSheet.addRow(['Reason', 'Amount', 'Percentage']);
        reasonsSheet.getRow(2).font = { bold: true };
        
        // Add reason data
        reportData.wastageReasons.forEach(reason => {
            reasonsSheet.addRow([
                reason.reason,
                reason.amount,
                reason.percentage / 100 // Convert to decimal for Excel percentage format
            ]);
        });
        
        // Format columns
        reasonsSheet.columns = [
            { header: 'Reason', key: 'reason', width: 40 },
            { header: 'Amount', key: 'amount', width: 15, style: { numFmt: '0.00' } },
            { header: 'Percentage', key: 'percentage', width: 15, style: { numFmt: '0.00%' } }
        ];
    }
    
    // Auto-fit columns for all sheets
    workbook.eachSheet(worksheet => {
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 0;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = Math.min(Math.max(maxLength + 2, 10), 40);
        });
    });
}

module.exports = { addWastageAnalysisToExcel };
