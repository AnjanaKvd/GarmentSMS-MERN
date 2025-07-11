function addFabricUsageToPDF(doc, reportData) {
    const { summary, materials } = reportData;
    const pageWidth = doc.page.width - 100;
    const col1 = 50;
    const col2 = 200;
    const col3 = 300;
    const col4 = 400;
    
    // Add title
    doc.fontSize(20).text('Fabric Usage Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    // Add date range if available
    if (summary.startDate || summary.endDate) {
        const dateRange = [
            summary.startDate ? `From: ${new Date(summary.startDate).toLocaleDateString()}` : '',
            summary.endDate ? `To: ${new Date(summary.endDate).toLocaleDateString()}` : ''
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
        ['Total Materials', summary.totalMaterials],
        ['Total Orders', summary.totalOrders],
        ['Total Usage', `${summary.totalUsage} units`],
        ['Total Wastage', `${summary.totalWastage} units`],
        ['Wastage Percentage', `${summary.totalWastePercentage}%`]
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
    
    // Add materials summary
    doc.addPage();
    doc.fontSize(16).text('Materials Summary', { underline: true });
    doc.moveDown();
    
    // Materials table header
    yPos = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Material', col1, yPos);
    doc.text('Item Code', col2, yPos);
    doc.text('Usage', col3, yPos);
    doc.text('Wastage', col4, yPos);
    
    yPos += 20;
    doc.moveTo(col1, yPos - 5).lineTo(col4 + 100, yPos - 5).stroke();
    
    // Materials data
    doc.font('Helvetica');
    materials.forEach((material, i) => {
        // Check if we need a new page
        if (yPos > doc.page.height - 100) {
            doc.addPage();
            yPos = 50;
            
            // Add header again on new page
            doc.font('Helvetica-Bold');
            doc.text('Material', col1, yPos);
            doc.text('Item Code', col2, yPos);
            doc.text('Usage', col3, yPos);
            doc.text('Wastage', col4, yPos);
            
            yPos += 20;
            doc.moveTo(col1, yPos - 5).lineTo(col4 + 100, yPos - 5).stroke();
            doc.font('Helvetica');
        }
        
        doc.text(material.name, col1, yPos);
        doc.text(material.itemCode || '-', col2, yPos);
        doc.text(`${material.totalUsage} ${material.unit || ''}`, col3, yPos);
        doc.text(`${material.totalWastage} ${material.unit || ''}`, col4, yPos);
        
        yPos += 20;
        
        // Add a line after each row
        doc.moveTo(col1, yPos - 5).lineTo(col4 + 100, yPos - 5)
            .lineWidth(0.5)
            .dash(2, { space: 2 })
            .stroke();
    });
    
    // Add detailed material usage on separate pages
    materials.forEach((material, materialIndex) => {
        doc.addPage();
        yPos = 50;
        
        // Material header
        doc.fontSize(16).text(`${material.name} (${material.itemCode || 'No Code'})`, { underline: true });
        doc.moveDown();
        
        // Usage by order
        doc.fontSize(14).text('Usage by Order', { underline: true });
        doc.moveDown();
        
        yPos = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('PO Number', col1, yPos);
        doc.text('Product', col2, yPos);
        doc.text('Usage', col3, yPos);
        doc.text('Wastage', col4, yPos);
        
        yPos += 20;
        doc.moveTo(col1, yPos - 5).lineTo(col4 + 100, yPos - 5).stroke();
        
        // Order data
        doc.font('Helvetica');
        material.orderUsage.forEach((order, i) => {
            // Check if we need a new page
            if (yPos > doc.page.height - 100) {
                doc.addPage();
                yPos = 50;
                
                // Add header again on new page
                doc.font('Helvetica-Bold');
                doc.text('PO Number', col1, yPos);
                doc.text('Product', col2, yPos);
                doc.text('Usage', col3, yPos);
                doc.text('Wastage', col4, yPos);
                
                yPos += 20;
                doc.moveTo(col1, yPos - 5).lineTo(col4 + 100, yPos - 5).stroke();
                doc.font('Helvetica');
            }
            
            doc.text(order.poNo || '-', col1, yPos);
            doc.text(order.productName || '-', col2, yPos);
            doc.text(`${order.usage} ${material.unit || ''}`, col3, yPos);
            doc.text(`${order.wastage} ${material.unit || ''}`, col4, yPos);
            
            yPos += 20;
        });
        
        // Add page number
        addPageNumber(doc);
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

module.exports = { addFabricUsageToPDF };
