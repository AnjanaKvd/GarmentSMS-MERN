function addWastageAnalysisToPDF(doc, reportData) {
    const pageWidth = doc.page.width - 100;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;
    
    // Add title
    doc.fontSize(20).text('Wastage Analysis Report', { align: 'center' });
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
        ['Total Items', reportData.summary.totalItems],
        ['Total Wastage', `${reportData.summary.totalWastage} units`],
        ['Average Wastage %', `${reportData.summary.averageWastagePercentage}%`],
        ['Highest Wastage Item', reportData.summary.highestWastageItem || 'N/A'],
        ['Lowest Wastage Item', reportData.summary.lowestWastageItem || 'N/A']
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
    
    // Add wastage by material
    doc.addPage();
    doc.fontSize(16).text('Wastage by Material', { underline: true });
    doc.moveDown();
    
    // Wastage table header
    yPos = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item Code', col1, yPos);
    doc.text('Material', col2, yPos);
    doc.text('Used', col3, yPos);
    doc.text('Wastage', col4, yPos);
    doc.text('% of Total', col5, yPos);
    
    yPos += 20;
    doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5).stroke();
    
    // Wastage data
    doc.font('Helvetica');
    reportData.materials.forEach((item, i) => {
        // Check if we need a new page
        if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 50;
            
            // Add header again on new page
            doc.font('Helvetica-Bold');
            doc.text('Item Code', col1, yPos);
            doc.text('Material', col2, yPos);
            doc.text('Used', col3, yPos);
            doc.text('Wastage', col4, yPos);
            doc.text('% of Total', col5, yPos);
            
            yPos += 20;
            doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5).stroke();
            doc.font('Helvetica');
        }
        
        doc.text(item.itemCode, col1, yPos);
        doc.text(item.name, col2, yPos, { width: 90, ellipsis: true });
        doc.text(item.totalUsed.toString(), col3, yPos);
        doc.text(item.totalWastage.toString(), col4, yPos);
        
        // Highlight high wastage items
        if (item.wastagePercentage > 10) { // More than 10% wastage
            doc.fillColor('red');
        } else if (item.wastagePercentage > 5) { // Between 5-10% wastage
            doc.fillColor('orange');
        }
        
        doc.text(`${item.wastagePercentage}%`, col5, yPos);
        doc.fillColor('black'); // Reset color
        
        yPos += 20;
        
        // Add a line after each row
        doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5)
            .lineWidth(0.5)
            .dash(2, { space: 2 })
            .stroke();
    });
    
    // Add wastage reasons if available
    if (reportData.wastageReasons && reportData.wastageReasons.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Wastage Reasons', { underline: true });
        doc.moveDown();
        
        yPos = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Reason', col1, yPos);
        doc.text('Amount', col3, yPos);
        doc.text('Percentage', col4, yPos);
        
        yPos += 20;
        doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
        
        // Wastage reasons data
        doc.font('Helvetica');
        reportData.wastageReasons.forEach((reason, i) => {
            // Check if we need a new page
            if (yPos > doc.page.height - 100) {
                doc.addPage();
                yPos = 50;
                
                // Add header again on new page
                doc.font('Helvetica-Bold');
                doc.text('Reason', col1, yPos);
                doc.text('Amount', col3, yPos);
                doc.text('Percentage', col4, yPos);
                
                yPos += 20;
                doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
                doc.font('Helvetica');
            }
            
            doc.text(reason.reason, col1, yPos, { width: 200, ellipsis: true });
            doc.text(reason.amount.toString(), col3, yPos);
            doc.text(`${reason.percentage}%`, col4, yPos);
            
            yPos += 20;
            
            // Add a line after each row
            doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5)
                .lineWidth(0.5)
                .dash(2, { space: 2 })
                .stroke();
        });
        
        // Add pie chart for wastage reasons
        doc.addPage();
        doc.fontSize(16).text('Wastage Distribution', { align: 'center' });
        doc.moveDown(0.5);
        
        // Draw a simple pie chart
        const centerX = pageWidth / 2 + 50;
        const centerY = doc.y + 100;
        const radius = 100;
        let startAngle = 0;
        
        // Calculate total for percentages
        const total = reportData.wastageReasons.reduce((sum, r) => sum + r.amount, 0);
        
        // Draw pie slices
        reportData.wastageReasons.forEach((reason, i) => {
            const percentage = reason.amount / total;
            const endAngle = startAngle + (Math.PI * 2 * percentage);
            
            // Use different colors for each slice
            const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
            doc.fillColor(colors[i % colors.length]);
            
            // Draw pie slice
            doc.save()
               .moveTo(centerX, centerY)
               .arc(centerX, centerY, radius, startAngle, endAngle, false)
               .lineTo(centerX, centerY)
               .fill();
            
            // Add label outside the pie chart
            const labelAngle = startAngle + (endAngle - startAngle) / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            doc.fontSize(8)
               .fillColor('black')
               .text(
                   `${reason.reason.substring(0, 10)} (${(percentage * 100).toFixed(1)}%)`,
                   labelX,
                   labelY,
                   { width: 60, align: 'center' }
               );
            
            startAngle = endAngle;
        });
        
        // Reset color
        doc.fillColor('black');
    }
    
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

module.exports = { addWastageAnalysisToPDF };
