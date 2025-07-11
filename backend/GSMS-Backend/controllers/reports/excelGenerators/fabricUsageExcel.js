const ExcelJS = require('exceljs');

async function addFabricUsageToExcel(workbook, reportData) {
    const { summary, materials } = reportData;
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Fabric Usage Summary');
    
    // Add report header with date range
    summarySheet.getCell('A1').value = 'Fabric Usage Summary Report';
    summarySheet.getCell('A1').font = { bold: true, size: 14 };
    
    if (summary.startDate || summary.endDate) {
        const dateRange = [
            summary.startDate ? `From: ${new Date(summary.startDate).toLocaleDateString()}` : '',
            summary.endDate ? `To: ${new Date(summary.endDate).toLocaleDateString()}` : ''
        ].filter(Boolean).join(' ');
        
        summarySheet.getCell('A2').value = dateRange;
    }
    
    // Add summary data
    summarySheet.addRow(['Total Materials', summary.totalMaterials]);
    summarySheet.addRow(['Total Orders', summary.totalOrders]);
    summarySheet.addRow(['Total Usage', summary.totalUsage]);
    summarySheet.addRow(['Total Wastage', summary.totalWastage]);
    summarySheet.addRow(['Wastage Percentage', `${summary.totalWastePercentage}%`]);
    
    // Materials sheet
    const materialsSheet = workbook.addWorksheet('Materials');
    materialsSheet.columns = [
        { header: 'Material', key: 'name', width: 30 },
        { header: 'Item Code', key: 'itemCode', width: 15 },
        { header: 'Total Usage', key: 'totalUsage', width: 15 },
        { header: 'Total Wastage', key: 'totalWastage', width: 15 },
        { header: 'Wastage %', key: 'wastePercentage', width: 15 }
    ];
    
    // Add materials data
    materials.forEach(material => {
        materialsSheet.addRow({
            name: material.name,
            itemCode: material.itemCode,
            totalUsage: material.totalUsage,
            totalWastage: material.totalWastage,
            wastePercentage: material.wastePercentage
        });
    });
    
    // Format numbers
    materialsSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
            row.getCell('totalUsage').numFmt = '0.00';
            row.getCell('totalWastage').numFmt = '0.00';
            row.getCell('wastePercentage').numFmt = '0.00%';
        }
    });
    
    // Add sheets for each material's details
    materials.forEach(material => {
        const sheet = workbook.addWorksheet(material.itemCode || material.name.substring(0, 25));
        
        // Material header
        sheet.getCell('A1').value = `${material.name} (${material.itemCode})`;
        sheet.getCell('A1').font = { bold: true, size: 14 };
        
        // Usage by order
        sheet.getCell('A3').value = 'Usage by Order';
        sheet.getCell('A3').font = { bold: true };
        
        const orderHeaders = ['PO Number', 'Product', 'Style', 'Usage', 'Wastage', 'Wastage %'];
        sheet.addRow(orderHeaders);
        
        material.orderUsage.forEach(order => {
            sheet.addRow([
                order.poNo,
                order.productName,
                order.styleNo,
                order.usage,
                order.wastage,
                order.wastage / (order.usage || 1) // Avoid division by zero
            ]);
        });
        
        // Usage by date
        sheet.addRow([]); // Empty row
        sheet.getCell(`A${sheet.rowCount + 1}`).value = 'Usage by Date';
        sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
        
        const dateHeaders = ['Date', 'Usage', 'Wastage', 'Wastage %'];
        sheet.addRow(dateHeaders);
        
        material.dateUsage.forEach(usage => {
            sheet.addRow([
                usage.date,
                usage.usage,
                usage.wastage,
                usage.wastage / (usage.usage || 1) // Avoid division by zero
            ]);
        });
        
        // Auto-fit columns
        sheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 0;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = Math.min(Math.max(maxLength + 2, 10), 30);
        });
    });
}

module.exports = { addFabricUsageToExcel };
