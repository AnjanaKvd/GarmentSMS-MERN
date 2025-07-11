const ExcelJS = require('exceljs');

async function addOrderFulfillmentToExcel(workbook, reportData) {
    const summarySheet = workbook.addWorksheet('Order Fulfillment Summary');
    
    // Add title
    summarySheet.getCell('A1').value = 'Order Fulfillment Report';
    summarySheet.getCell('A1').font = { bold: true, size: 14 };
    
    // Add summary data
    summarySheet.addRow(['Total Orders', reportData.summary.totalOrders]);
    summarySheet.addRow(['Completed Orders', reportData.summary.completedOrders]);
    summarySheet.addRow(['In Progress', reportData.summary.inProgress]);
    summarySheet.addRow(['Not Started', reportData.summary.notStarted]);
    summarySheet.addRow(['Completion Rate', `${reportData.summary.completionRate}%`]);
    
    // Add a blank row
    summarySheet.addRow([]);
    
    // Add order details header
    const headers = [
        'PO Number',
        'Product',
        'Style',
        'Order Date',
        'Due Date',
        'Quantity',
        'Completed',
        'Pending',
        'Status',
        'Completion %'
    ];
    
    const headerRow = summarySheet.addRow(headers);
    headerRow.font = { bold: true };
    
    // Add order data
    reportData.orders.forEach(order => {
        summarySheet.addRow([
            order.poNo,
            order.productName,
            order.styleNo,
            order.orderDate,
            order.dueDate,
            order.quantity,
            order.completed,
            order.pending,
            order.status,
            order.completionPercentage / 100  // Convert to decimal for Excel percentage format
        ]);
    });
    
    // Format columns
    summarySheet.columns = [
        { header: 'PO Number', key: 'poNo', width: 15 },
        { header: 'Product', key: 'productName', width: 25 },
        { header: 'Style', key: 'styleNo', width: 15 },
        { header: 'Order Date', key: 'orderDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
        { header: 'Due Date', key: 'dueDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
        { header: 'Quantity', key: 'quantity', width: 12, style: { numFmt: '0' } },
        { header: 'Completed', key: 'completed', width: 12, style: { numFmt: '0' } },
        { header: 'Pending', key: 'pending', width: 12, style: { numFmt: '0' } },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Completion %', key: 'completionPercentage', width: 15, style: { numFmt: '0.00%' } }
    ];
    
    // Auto-fit columns
    summarySheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 30);
    });
}

module.exports = { addOrderFulfillmentToExcel };
