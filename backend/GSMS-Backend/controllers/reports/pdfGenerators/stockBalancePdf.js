const { format, parseISO } = require('date-fns');

// Helper function to add a new page with header
function addNewPage(doc, title, yStart = 50) {
    doc.addPage();
    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown(0.5);
    
    // Add date range if available
    if (doc.reportData?.summary) {
        const { startDate, endDate } = doc.reportData.summary;
        let dateRange = '';
        
        if (startDate || endDate) {
            const start = startDate ? format(parseISO(new Date(startDate).toISOString()), 'PP') : 'Start';
            const end = endDate ? format(parseISO(new Date(endDate).toISOString()), 'PP') : 'Present';
            dateRange = `Period: ${start} to ${end}`;
        } else {
            dateRange = 'All Time';
        }
        
        doc.fontSize(10).text(dateRange, { align: 'center' });
    }
    
    doc.moveDown(1);
    return yStart;
}

// Helper function to draw a table row
function drawTableRow(doc, columns, yPos, isHeader = false, colWidths = null) {
    // Default column widths if not provided
    if (!colWidths) {
        colWidths = [80, 150, 60, 60, 60, 60];
    }
    
    const startX = 40; // Reduced from 50 for better margins
    let currentX = startX;
    
    // Calculate total width for the line
    const totalWidth = colWidths.reduce((a, b) => a + b, 0) + ((colWidths.length - 1) * 10);
    
    columns.forEach((col, i) => {
        const options = {
            width: colWidths[i],
            align: (i >= 4 && i <= 8) ? 'right' : 'left', // Right align numeric columns
            lineGap: 5,
            ellipsis: i === 1 ? true : false, // Only ellipsis for material name
            height: 15,
            lineBreak: false
        };
        
        // Save current fill color
        const currentFill = doc._fillColor;
        
        if (isHeader) {
            doc.font('Helvetica-Bold')
               .fillColor('#2c3e50');
        }
        
        // Draw cell background for header
        if (isHeader) {
            doc.save()
               .rect(currentX - 2, yPos - 5, colWidths[i] + 4, 25)
               .fill('#f8f9fa')
               .restore();
        }
        
        // Draw cell text
        doc.text(col.toString(), currentX, yPos + 3, options);
        
        // Reset styles
        doc.font('Helvetica')
           .fillColor(currentFill);
        
        currentX += colWidths[i] + 10;
    });
    
    // Draw line under row
    doc.save()
       .lineWidth(0.5)
       .moveTo(startX, yPos + 22)
       .lineTo(startX + totalWidth, yPos + 22)
       .stroke('#e0e0e0')
       .restore();
    
    return yPos + 25; // Increased from 20 to give more space between rows
}

// Helper function to draw a section header
function drawSectionHeader(doc, text, yPos) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text(text, 50, yPos);
    
    doc.moveTo(50, yPos + 5)
       .lineTo(200, yPos + 5)
       .strokeColor('#3498db')
       .stroke();
    
    doc.fillColor('black');
    return yPos + 20;
}

// Generate the stock balance PDF
function addStockBalanceToPDF(doc, reportData) {
    // Store report data in doc for helper functions
    doc.reportData = reportData;
    
    // Set up initial styles
    const pageWidth = doc.page.width - 100;
    const margin = 50;
    let yPos = 80;
    
    // Add title and date range
    doc.fontSize(20).text('Stock Balance Report', { align: 'center' });
    doc.moveDown(0.5);
    
    // Add date range if available
    if (reportData.summary.startDate || reportData.summary.endDate) {
        const start = reportData.summary.startDate ? 
            format(parseISO(new Date(reportData.summary.startDate).toISOString()), 'PP') : 'Start';
        const end = reportData.summary.endDate ? 
            format(parseISO(new Date(reportData.summary.endDate).toISOString()), 'PP') : 'Present';
        
        doc.fontSize(10).text(`Period: ${start} to ${end}`, { align: 'center' });
    }
    
    doc.moveDown(1);
    doc.fontSize(10).text(`Generated: ${format(new Date(), 'PPpp')}`, { align: 'center' });
    doc.moveDown(2);
    
    // Add summary cards
    yPos = drawSectionHeader(doc, 'Summary', yPos);
    
    // Summary cards
    const summaryCards = [
        { label: 'Total Items', value: reportData.summary.totalItems, color: '#3498db' },
        { label: 'In Stock', value: reportData.summary.inStockItems, color: '#2ecc71' },
        { label: 'Low Stock', value: reportData.summary.lowStockItems, color: '#f39c12' },
        { label: 'Out of Stock', value: reportData.summary.outOfStockItems, color: '#e74c3c' },
        { 
            label: 'Total Opening', 
            value: reportData.summary.totalOpening.toFixed(2), 
            color: '#9b59b6' 
        },
        { 
            label: 'Total Received', 
            value: reportData.summary.totalReceived.toFixed(2), 
            color: '#1abc9c' 
        },
        { 
            label: 'Total Issued', 
            value: reportData.summary.totalIssued.toFixed(2), 
            color: '#e67e22' 
        },
        { 
            label: 'Total Closing', 
            value: reportData.summary.totalClosing.toFixed(2), 
            color: '#27ae60',
            bold: true
        }
    ];
    
    // Draw summary cards in a grid
    let cardX = margin;
    let cardY = yPos;
    const cardWidth = (pageWidth - (margin * 2) - 20) / 2;
    const cardHeight = 40;
    
    summaryCards.forEach((card, index) => {
        // Check if we need a new row
        if (index > 0 && index % 2 === 0) {
            cardX = margin;
            cardY += cardHeight + 10;
        } else if (index > 0) {
            cardX += cardWidth + 20;
        }
        
        // Draw card background
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5)
           .fill(card.color + '20'); // Add 20% opacity
        
        // Add card content
        doc.fontSize(9)
           .fillColor('#7f8c8d')
           .text(card.label, cardX + 10, cardY + 5);
        
        doc.fontSize(14)
           .font(card.bold ? 'Helvetica-Bold' : 'Helvetica')
           .fillColor(card.color)
           .text(card.value, cardX + 10, cardY + 20);
    });
    
    // Reset styles
    doc.fillColor('black').font('Helvetica');
    
    // Add material summary table
    yPos = cardY + cardHeight + 30;
    yPos = drawSectionHeader(doc, 'Material Summary', yPos);
    
    // Check if we need a new page
    if (yPos > doc.page.height - 200) {
        yPos = addNewPage(doc, 'Stock Balance Report - Material Summary');
    }
    
    // Update column widths for the material summary table
    const materialSummaryColWidths = [60, 100, 60, 40, 50, 50, 50, 50, 40, 40, 60];
    
    // Draw table header
    yPos = drawTableRow(doc, 
        [
            'Item Code', 
            'Material Name', 
            'Category', 
            'Unit', 
            'Opening', 
            'Received', 
            'Issued', 
            'Closing', 
            'Reorder',
            'Status',
            'Last Updated'
        ], 
        yPos, 
        true,
        materialSummaryColWidths
    );
    
    // Draw material rows
    reportData.materials.forEach((material, index) => {
        // Check if we need a new page
        if (yPos > doc.page.height - 50) {
            yPos = addNewPage(doc, 'Stock Balance Report - Material Summary');
            yPos = drawTableRow(doc, 
                [
                    'Item Code', 
                    'Material Name', 
                    'Category', 
                    'Unit', 
                    'Opening', 
                    'Received', 
                    'Issued', 
                    'Closing', 
                    'Reorder',
                    'Status',
                    'Last Updated'
                ], 
                yPos, 
                true,
                materialSummaryColWidths
            );
        }
        
        // Set row color based on status
        if (material.status === 'Low Stock') {
            doc.fillColor('#f39c12');
        } else if (material.status === 'Out of Stock') {
            doc.fillColor('#e74c3c');
        }
        
        // Format last transaction date
        const lastTransaction = material.lastTransaction ? 
            format(parseISO(new Date(material.lastTransaction).toISOString()), 'PP') : 'N/A';
            
        // Draw row
        yPos = drawTableRow(doc, [
            material.itemCode || 'N/A',
            material.name || 'N/A',
            material.category || 'N/A',
            material.unit || 'PCS',
            material.openingBalance?.toFixed(2) || '0.00',
            material.received?.toFixed(2) || '0.00',
            material.issued?.toFixed(2) || '0.00',
            material.closingBalance?.toFixed(2) || '0.00',
            material.reorderLevel?.toFixed(2) || '0.00',
            material.status || 'N/A',
            lastTransaction
        ], yPos, false, materialSummaryColWidths);
        
        // Reset color
        doc.fillColor('black');
    });
    
    // Add transaction details for each material
    reportData.materials.forEach((material, index) => {
        if (!material.transactions || material.transactions.length === 0) return;
        
        // Add a new page for each material's transactions
        yPos = addNewPage(doc, `Transactions: ${material.name} (${material.itemCode})`);
        
        // Add material info section with better layout
        const infoY = yPos;
        const infoX = 50;
        const infoWidth = 250;
        const statusColor = material.status === 'Low Stock' ? '#f39c12' : 
                          material.status === 'Out of Stock' ? '#e74c3c' : '#27ae60';
        
        // Draw info box
        doc.save()
           .roundedRect(infoX - 10, infoY - 10, infoWidth, 80, 5)
           .fill('#f8f9fa')
           .stroke('#e0e0e0')
           .restore();
        
        // Material name and code
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text(material.name || 'Unnamed Material', infoX, infoY, {
               width: infoWidth,
               lineBreak: false,
               ellipsis: true
           });
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#7f8c8d')
           .text(`Item Code: ${material.itemCode || 'N/A'}`, infoX, infoY + 20);
        
        // Category and unit
        doc.text(`Category: ${material.category || 'N/A'}`, infoX, infoY + 35);
        doc.text(`Unit: ${material.unit || 'PCS'}`, infoX + 120, infoY + 35);
        
        // Status badge
        const statusText = material.status || 'N/A';
        const statusWidth = doc.widthOfString(statusText) + 20;
        
        doc.save()
           .roundedRect(infoX, infoY + 50, statusWidth, 20, 10)
           .fill(statusColor + '20') // 20% opacity
           .stroke(statusColor)
           .restore();
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(statusColor)
           .text(statusText, infoX + 10, infoY + 54);
        
        // Stock summary on the right
        const summaryX = infoX + infoWidth + 20;
        const summaryWidth = doc.page.width - summaryX - 50;
        
        doc.save()
           .roundedRect(summaryX - 10, infoY - 10, summaryWidth, 80, 5)
           .fill('#f8f9fa')
           .stroke('#e0e0e0')
           .restore();
        
        doc.fontSize(10)
           .fillColor('#2c3e50')
           .text('STOCK SUMMARY', summaryX, infoY, {
               underline: true,
               width: summaryWidth,
               align: 'center'
           });
        
        // Stock values
        const stockValues = [
            { label: 'Opening:', value: material.openingBalance?.toFixed(2) || '0.00' },
            { label: '+ Received:', value: material.received?.toFixed(2) || '0.00' },
            { label: '- Issued:', value: material.issued?.toFixed(2) || '0.00' },
            { 
                label: '= Closing:', 
                value: material.closingBalance?.toFixed(2) || '0.00',
                bold: true,
                color: statusColor
            }
        ];
        
        stockValues.forEach((item, i) => {
            const y = infoY + 20 + (i * 15);
            const isTotal = i === stockValues.length - 1;
            
            doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(item.color || '#2c3e50')
               .text(item.label, summaryX, y);
            
            doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(item.color || '#2c3e50')
               .text(item.value, summaryX + 150, y, { align: 'right' });
        });
        
        // Reset styles
        doc.font('Helvetica')
           .fillColor('black');
        
        yPos = infoY + 90; // Position for the transaction table
        
        // Add summary
        const summaryY = doc.y;
        doc.fontSize(10)
           .text('Opening Balance:', 50, summaryY, { width: 100, align: 'left' })
           .text(material.openingBalance.toFixed(2), 150, summaryY, { width: 60, align: 'right' })
           .text('+', 220, summaryY)
           .text('Received:', 240, summaryY, { width: 70, align: 'left' })
           .text(material.received.toFixed(2), 320, summaryY, { width: 60, align: 'right' })
           .text('-', 390, summaryY)
           .text('Issued:', 410, summaryY, { width: 50, align: 'left' })
           .text(material.issued.toFixed(2), 470, summaryY, { width: 60, align: 'right' })
           .text('=', 540, summaryY)
           .font('Helvetica-Bold')
           .text('Closing Balance:', 560, summaryY, { width: 100, align: 'left' })
           .text(material.closingBalance.toFixed(2), 670, summaryY, { width: 60, align: 'right' })
           .font('Helvetica');
        
        // Add transaction table
        yPos = summaryY + 30;
        yPos = drawSectionHeader(doc, 'Transaction History', yPos);
        
        // Define column widths for transaction table
        const transactionColWidths = [80, 50, 80, 100, 60, 60, 100];
        
        // Draw transaction table header
        yPos = drawTableRow(doc, 
            [
                'Date', 
                'Type', 
                'Reference', 
                'Product', 
                'Quantity', 
                'Balance', 
                'Remarks'
            ], 
            yPos, 
            true,
            transactionColWidths
        );
        
        // Sort transactions by date
        const sortedTransactions = [...material.transactions].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        // Calculate running balance
        let runningBalance = material.openingBalance;
        
        // Draw transaction rows
        sortedTransactions.forEach((txn, idx) => {
            // Check if we need a new page
            if (yPos > doc.page.height - 50) {
                yPos = addNewPage(doc, `Transactions: ${material.name} (${material.itemCode})`);
                yPos = drawSectionHeader(doc, 'Transaction History', yPos - 20);
                yPos = drawTableRow(doc, 
                    ['Date', 'Type', 'Reference', 'Quantity', 'Balance', 'Remarks'], 
                    yPos, 
                    true
                );
            }
            
            // Update running balance
            runningBalance += txn.type === 'IN' ? txn.quantity : -txn.quantity;
            
            // Set color based on transaction type
            doc.fillColor(txn.type === 'IN' ? '#27ae60' : '#e74c3c');
            
            // Format date and prepare data
            const formattedDate = format(parseISO(new Date(txn.date).toISOString()), 'yyyy-MM-dd HH:mm');
            const isIn = txn.type === 'IN';
            const typeColor = isIn ? '#27ae60' : '#e74c3c';
            
            // Save current fill color
            const currentFill = doc._fillColor;
            
            // Set alternating row color
            if (idx % 2 === 0) {
                doc.fillColor('#f9f9f9');
                doc.rect(38, yPos - 3, doc.page.width - 76, 25).fill();
                doc.fillColor(currentFill);
            }
            
            // Draw row with type-specific colors
            doc.fillColor(typeColor);
            yPos = drawTableRow(doc, [
                formattedDate,
                txn.type,
                txn.reference || 'N/A',
                txn.product || (txn.remarks && txn.remarks.startsWith('Order:') ? txn.remarks : 'N/A'),
                txn.quantity.toFixed(2),
                runningBalance.toFixed(2),
                txn.remarks && !txn.remarks.startsWith('Order:') ? txn.remarks : ''
            ], yPos, false, transactionColWidths);
            
            // Reset color
            doc.fillColor(currentFill);
            
            // Reset color
            doc.fillColor('black');
        });
    });
    
    // Add legend section with improved layout
    yPos = addNewPage(doc, 'Stock Balance Report - Legend');
    yPos = drawSectionHeader(doc, 'Report Legend', yPos);
    
    // Add report info
    doc.fontSize(10)
       .fillColor('#2c3e50')
       .text('This report provides a comprehensive view of your inventory status, including detailed transaction history for each material.', 50, yPos, {
           width: doc.page.width - 100,
           align: 'left',
           lineGap: 5
       });
    
    yPos += 30;
    
    // Define legend data with more details
    const legendData = [
        { 
            status: 'In Stock', 
            color: '#2ecc71', 
            description: 'Sufficient stock available (above reorder level)' 
        },
        { 
            status: 'Low Stock', 
            color: '#f39c12', 
            description: 'Stock level is below reorder level - consider reordering' 
        },
        { 
            status: 'Out of Stock', 
            color: '#e74c3c', 
            description: 'No stock available - immediate action required' 
        },
        { 
            status: 'Transaction IN', 
            color: '#27ae60', 
            description: 'Stock received/added to inventory' 
        },
        { 
            status: 'Transaction OUT', 
            color: '#e74c3c', 
            description: 'Stock issued/used from inventory' 
        },
        { 
            status: 'Summary Card', 
            color: '#3498db', 
            description: 'Quick overview of key metrics at the top of the report' 
        },
        { 
            status: 'Material Summary', 
            color: '#9b59b6', 
            description: 'Detailed list of all materials with current stock levels' 
        }
    ];
    
    // Add legend title
    yPos = drawSectionHeader(doc, 'Color Legend', yPos);
    
    // Draw legend items in a 2-column layout
    const legendCol1X = 60;
    const legendCol2X = (doc.page.width / 2) + 20;
    let currentCol = 1;
    let currentX = legendCol1X;
    
    legendData.forEach((item, index) => {
        if (yPos > doc.page.height - 70) {
            yPos = addNewPage(doc, 'Stock Balance Report - Legend');
            yPos = drawSectionHeader(doc, 'Legend (continued)', yPos);
            currentCol = 1;
            currentX = legendCol1X;
        }
        
        // Switch to second column if needed
        if (index > 0 && index % 4 === 0) {
            currentCol = 2;
            currentX = legendCol2X;
            yPos -= 4 * 45; // Reset Y position for second column
        }
        
        // Draw legend item
        doc.save()
           .roundedRect(currentX, yPos, 20, 20, 3)
           .fill(item.color + '40') // 25% opacity
           .stroke(item.color)
           .restore();
        
        // Add status text
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .fillColor(item.color)
           .text(item.status, currentX + 25, yPos + 4);
        
        // Add description
        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#7f8c8d')
           .text(item.description, currentX, yPos + 22, {
               width: 200,
               lineGap: 2,
               align: 'left'
           });
        
        yPos += 45; // Increased spacing for better readability
    });
    
    // Add report footer with generation info
    yPos += 20;
    doc.fontSize(8)
       .fillColor('#95a5a6')
       .text(`Report generated by GarmentSMS on ${format(new Date(), 'PPpp')}`, 50, yPos, {
           width: doc.page.width - 100,
           align: 'center',
           lineGap: 5
       });
    
    // Add page numbers to all pages
    const pages = doc.bufferedPageRange().count;
    for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        addPageNumber(doc, i + 1, pages);
    }
}

function addPageNumber(doc, pageNumber, totalPages) {
    doc.fontSize(10)
       .text(
           `Page ${pageNumber} of ${totalPages}`,
           doc.page.width - 100,
           doc.page.height - 50
       );
}

module.exports = { addStockBalanceToPDF };
