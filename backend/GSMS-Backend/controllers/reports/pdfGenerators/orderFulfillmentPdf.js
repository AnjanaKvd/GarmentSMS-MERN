function addOrderFulfillmentToPDF(doc, reportData) {
    const pageWidth = doc.page.width - 100;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;
    
    // Add title
    doc.fontSize(20).text('Order Fulfillment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    // Add date range if available
    if (reportData.summary.startDate || reportData.summary.endDate) {
        const dateRange = [
            reportData.summary.startDate ? `From: ${new Date(reportData.summary.startDate).toLocaleDateString()}` : '',
            reportData.summary.endDate ? `To: ${new Date(reportData.summary.endDate).toLocaleDateString()}` : ''
        ].filter(Boolean).join(' ');
        
        doc.moveDown();
        doc.fontSize(12).text(dateRange, { align: 'center' });
    }
    
    doc.moveDown(2);
    
    // Add summary section
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    
    // Summary table
    let yPos = doc.y;
    
    // Draw header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Metric', col1, yPos);
    doc.text('Value', col2, yPos);
    
    yPos += 20;
    doc.moveTo(col1, yPos - 5).lineTo(col3, yPos - 5).stroke();
    
    // Draw rows
    doc.font('Helvetica');
    const summaryData = [
        ['Total Orders', reportData.summary.totalOrders],
        ['Completed Orders', reportData.summary.completedOrders],
        ['In Progress', reportData.summary.inProgress],
        ['Not Started', reportData.summary.notStarted],
        ['Completion Rate', `${reportData.summary.completionRate}%`]
    ];
    
    summaryData.forEach(([label, value], i) => {
        doc.text(label, col1, yPos);
        doc.text(String(value), col2, yPos);
        yPos += 20;
        
        // Add a line after each row except the last one
        if (i < summaryData.length - 1) {
            doc.moveTo(col1, yPos - 5).lineTo(col3, yPos - 5).stroke();
        }
    });
    
    doc.moveDown(2);
    
    // Add order details
    doc.addPage();
    doc.fontSize(16).text('Order Details', { underline: true });
    doc.moveDown();
    
    // Order table header
    yPos = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('PO Number', col1, yPos);
    doc.text('Product', col2, yPos);
    doc.text('Order Date', col3, yPos);
    doc.text('Due Date', col4, yPos);
    doc.text('Status', col5, yPos);
    
    yPos += 20;
    doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5).stroke();
    
    // Order data
    doc.font('Helvetica');
    reportData.orders.forEach((order, i) => {
        // Check if we need a new page
        if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 50;
            
            // Add header again on new page
            doc.font('Helvetica-Bold');
            doc.text('PO Number', col1, yPos);
            doc.text('Product', col2, yPos);
            doc.text('Order Date', col3, yPos);
            doc.text('Due Date', col4, yPos);
            doc.text('Status', col5, yPos);
            
            yPos += 20;
            doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5).stroke();
            doc.font('Helvetica');
        }
        
        // Set color based on status
        if (order.status === 'Completed') {
            doc.fillColor('green');
        } else if (order.status === 'In Progress') {
            doc.fillColor('orange');
        } else if (order.status === 'Not Started') {
            doc.fillColor('red');
        }
        
        doc.text(order.poNo || '-', col1, yPos);
        doc.text(order.productName || '-', col2, yPos, { width: 90, ellipsis: true });
        doc.text(new Date(order.orderDate).toLocaleDateString(), col3, yPos);
        doc.text(new Date(order.dueDate).toLocaleDateString(), col4, yPos);
        doc.text(order.status, col5, yPos);
        
        // Reset color
        doc.fillColor('black');
        
        yPos += 20;
        
        // Add progress bar
        const progressBarWidth = 200;
        const progressBarHeight = 10;
        const progress = order.completionPercentage / 100;
        
        // Background
        doc.rect(col1, yPos, progressBarWidth, progressBarHeight)
           .fillOpacity(0.2)
           .fill('gray');
        
        // Progress
        doc.rect(col1, yPos, progressBarWidth * progress, progressBarHeight)
           .fillOpacity(0.7)
           .fill(order.status === 'Completed' ? 'green' : 'blue')
           .fillOpacity(1);
        
        // Text
        doc.fontSize(8)
           .fillColor('black')
           .text(
               `${order.completionPercentage}% Complete`,
               col1 + 5,
               yPos + 1,
               { width: progressBarWidth - 10, align: 'center' }
           );
        
        yPos += 25;
        
        // Add a line after each order
        doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5)
            .lineWidth(0.5)
            .dash(2, { space: 2 })
            .stroke();
            
        yPos += 10;
    });
    
    // Add page number to the last page
    addPageNumber(doc);
}

function addPageNumber(doc) {
    const pageNumber = doc.bufferedPageRange().start + 1;
    const totalPages = doc.bufferedPageRange().count;
    
    doc.fontSize(10)
       .text(
           `Page ${pageNumber} of ${totalPages}`,
           doc.page.width - 100,
           doc.page.height - 50
       );
}

module.exports = { addOrderFulfillmentToPDF };
