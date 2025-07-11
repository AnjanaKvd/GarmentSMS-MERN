const ExcelJS = require('exceljs');
const { format } = require('date-fns');

// Color constants for consistent styling
const COLORS = {
    PRIMARY: '2F5496',
    SUCCESS: '2E7D32',
    WARNING: 'E68A00',
    DANGER: 'D32F2F',
    LIGHT_GRAY: 'F5F5F5',
    WHITE: 'FFFFFF',
    TEXT: '212121',
    BORDER: 'E0E0E0',
    LIGHT_GREEN: 'E8F5E9',
    LIGHT_AMBER: 'FFF8E1',
    LIGHT_RED: 'FFEBEE',
    LIGHT_BLUE: 'E3F2FD'
};

/**
 * Apply consistent styling to a cell
 */
function styleCell(cell, options = {}) {
    const { bold, color, bgColor, numFmt, alignment, border = true } = options;
    
    // Apply font styles
    cell.font = {
        name: 'Arial',
        size: 11,
        bold: !!bold,
        ...(color && { color: { argb: color } })
    };
    
    // Apply background color
    if (bgColor) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
        };
    }
    
    // Apply number format
    if (numFmt) {
        cell.numFmt = numFmt;
    }
    
    // Apply alignment
    cell.alignment = {
        vertical: 'middle',
        wrapText: true,
        ...alignment
    };
    
    // Apply borders if enabled
    if (border) {
        cell.border = {
            left: { style: 'thin', color: { argb: COLORS.BORDER } },
            right: { style: 'thin', color: { argb: COLORS.BORDER } },
            top: { style: 'thin', color: { argb: COLORS.BORDER } },
            bottom: { style: 'thin', color: { argb: COLORS.BORDER } }
        };
    }
}

/**
 * Create the main summary worksheet
 */
function createSummaryWorksheet(workbook, reportData) {
    console.log('=== CREATING SUMMARY WORKSHEET ===');
    
    // Log the input data structure
    console.log('Summary data keys:', Object.keys(reportData));
    console.log('Has filteredMaterials:', !!reportData.filteredMaterials);
    console.log('Has materials:', !!reportData.materials);
    console.log('Has summary:', !!reportData.summary);
    
    if (reportData.summary) {
        console.log('Summary data:', {
            totalItems: reportData.summary.totalItems,
            inStockItems: reportData.summary.inStockItems,
            lowStockItems: reportData.summary.lowStockItems,
            outOfStockItems: reportData.summary.outOfStockItems,
            totalOpening: reportData.summary.totalOpening,
            totalReceived: reportData.summary.totalReceived,
            totalIssued: reportData.summary.totalIssued,
            totalClosing: reportData.summary.totalClosing
        });
    }
    
    // Get materials data - check both root and materials property
    let materials = [];
    if (Array.isArray(reportData)) {
        materials = reportData; // If reportData is the materials array itself
    } else if (Array.isArray(reportData.materials)) {
        materials = reportData.materials;
    } else if (Array.isArray(reportData.filteredMaterials)) {
        materials = reportData.filteredMaterials;
    }
    
    const summary = reportData.summary || {};
    
    console.log('Materials array length:', materials.length);
    if (materials.length > 0) {
        console.log('First material data:', {
            name: materials[0].name,
            itemCode: materials[0].itemCode,
            openingBalance: materials[0].openingBalance,
            received: materials[0].received,
            issued: materials[0].issued,
            closingBalance: materials[0].closingBalance,
            status: materials[0].status,
            transactionCount: materials[0].transactionCount
        });
    }
    
    console.log(`Processing ${materials.length} materials for summary worksheet`);
    
    if (materials.length > 0) {
        console.log('First material in summary:', {
            itemCode: materials[0].itemCode,
            name: materials[0].name,
            openingBalance: materials[0].openingBalance,
            received: materials[0].received,
            issued: materials[0].issued,
            closingBalance: materials[0].closingBalance,
            status: materials[0].status
        });
    }
    
    const worksheet = workbook.addWorksheet('Stock Summary');
    console.log('Created worksheet:', worksheet.name);
    
    // Set up columns
    worksheet.columns = [
        { header: 'Item Code', key: 'itemCode', width: 15 },
        { header: 'Material Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Opening', key: 'openingBalance', width: 12, style: { numFmt: '#,##0.00' } },
        { header: 'Received', key: 'received', width: 12, style: { numFmt: '#,##0.00' } },
        { header: 'Issued', key: 'issued', width: 12, style: { numFmt: '#,##0.00' } },
        { header: 'Closing', key: 'closingBalance', width: 12, style: { numFmt: '#,##0.00' } },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Last Transaction', key: 'lastTransaction', width: 20 }
    ];
    
    // Add title
    const titleRow = worksheet.addRow(['Stock Balance Report']);
    titleRow.font = { bold: true, size: 16, color: { argb: COLORS.PRIMARY } };
    worksheet.mergeCells('A1:J1');
    
    // Add date range
    const dateInfo = [];
    if (reportData.startDate || reportData.endDate) {
        const start = reportData.startDate ? format(new Date(reportData.startDate), 'PP') : 'Start';
        const end = reportData.endDate ? format(new Date(reportData.endDate), 'PP') : 'Present';
        dateInfo.push(`Period: ${start} to ${end}`);
    }
    dateInfo.push(`Generated: ${format(new Date(), 'PPpp')}`);
    
    const dateRow = worksheet.addRow([dateInfo.join(' | ')]);
    dateRow.font = { size: 10, italic: true };
    worksheet.mergeCells(`A${dateRow.number}:J${dateRow.number}`);
    
    // Add summary section
    const summaryHeaderRow = worksheet.addRow(['Summary']);
    summaryHeaderRow.font = { bold: true, color: { argb: COLORS.WHITE } };
    summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PRIMARY } };
    worksheet.mergeCells(`A${summaryHeaderRow.number}:J${summaryHeaderRow.number}`);
    
    // Add summary metrics
    const metrics = [
        { label: 'Total Items', value: summary.totalItems || 0, bgColor: COLORS.LIGHT_BLUE },
        { label: 'In Stock', value: summary.inStockItems || 0, bgColor: COLORS.LIGHT_GREEN },
        { label: 'Low Stock', value: summary.lowStockItems || 0, bgColor: COLORS.LIGHT_AMBER },
        { label: 'Out of Stock', value: summary.outOfStockItems || 0, bgColor: COLORS.LIGHT_RED },
        { label: 'Total Opening', value: summary.totalOpening || 0, bgColor: COLORS.LIGHT_GRAY, numFmt: '#,##0.00' },
        { label: 'Total Received', value: summary.totalReceived || 0, bgColor: COLORS.LIGHT_GREEN, numFmt: '#,##0.00' },
        { label: 'Total Issued', value: summary.totalIssued || 0, bgColor: COLORS.LIGHT_RED, numFmt: '#,##0.00' },
        { label: 'Total Closing', value: summary.totalClosing || 0, bgColor: COLORS.LIGHT_BLUE, numFmt: '#,##0.00', bold: true }
    ];
    
    // Add metrics in a 2x4 grid
    for (let i = 0; i < metrics.length; i += 2) {
        const row = worksheet.addRow([]);
        const metric1 = metrics[i];
        const metric2 = metrics[i + 1];
        
        // First metric
        const cell1 = row.getCell(1);
        cell1.value = metric1.label;
        styleCell(cell1, { 
            bgColor: metric1.bgColor, 
            color: COLORS.TEXT,
            bold: true,
            alignment: { horizontal: 'left' }
        });
        
        const value1 = row.getCell(2);
        value1.value = metric1.value;
        styleCell(value1, {
            bgColor: metric1.bgColor,
            color: COLORS.TEXT,
            bold: metric1.bold || false,
            numFmt: metric1.numFmt
        });
        
        // Second metric if exists
        if (metric2) {
            const cell2 = row.getCell(4);
            cell2.value = metric2.label;
            styleCell(cell2, { 
                bgColor: metric2.bgColor, 
                color: COLORS.TEXT,
                bold: true,
                alignment: { horizontal: 'left' }
            });
            
            const value2 = row.getCell(5);
            value2.value = metric2.value;
            styleCell(value2, {
                bgColor: metric2.bgColor,
                color: COLORS.TEXT,
                bold: metric2.bold || false,
                numFmt: metric2.numFmt
            });
            
            // Merge cells for better appearance
            worksheet.mergeCells(row.number, 1, row.number, 2);
            worksheet.mergeCells(row.number, 4, row.number, 5);
        } else {
            // If only one metric, merge across all columns
            worksheet.mergeCells(row.number, 1, row.number, 10);
        }
    }
    
    // Add materials table header
    const headerRow = worksheet.addRow([
        'Item Code', 'Material Name', 'Category', 'Unit', 
        'Opening', 'Received', 'Issued', 'Closing',
        'Status', 'Last Transaction'
    ]);
    
    // Style header row
    headerRow.eachCell((cell) => {
        styleCell(cell, {
            bold: true,
            color: COLORS.WHITE,
            bgColor: COLORS.PRIMARY,
            alignment: { horizontal: 'center' }
        });
    });
    
    // Add materials data
    console.log(`Adding ${materials.length} materials to the worksheet`);
    materials.forEach((material, index) => {
        if (!material) {
            console.warn(`Material at index ${index} is undefined or null`);
            return;
        }

        const materialData = {
            itemCode: material.itemCode || 'N/A',
            name: material.name || 'N/A',
            category: material.category || 'N/A',
            unit: material.unit || 'pcs',
            openingBalance: material.openingBalance || 0,
            received: material.received || 0,
            issued: material.issued || 0,
            closingBalance: material.closingBalance || 0,
            status: material.status || 'In Stock',
            lastTransaction: material.lastTransaction 
                ? format(new Date(material.lastTransaction), 'PPpp') 
                : 'N/A'
        };

        console.log(`Adding material ${index + 1}:`, materialData);
        
        try {
            const row = worksheet.addRow(materialData);
            console.log(`Added row at position ${row.number} for material ${material.itemCode || 'N/A'}`);
            
            // Style status cell based on stock level
            const statusCell = row.getCell('I'); // Column I is Status
            let statusBgColor = COLORS.LIGHT_GREEN;
            let statusTextColor = COLORS.SUCCESS;
            
            const materialStatus = material.status || 
                                 (material.closingBalance <= 0 ? 'Out of Stock' : 
                                 (material.reorderLevel && material.closingBalance <= material.reorderLevel ? 'Low Stock' : 'In Stock'));
            
            if (materialStatus === 'Low Stock') {
                statusBgColor = COLORS.LIGHT_AMBER;
                statusTextColor = COLORS.WARNING;
            } else if (materialStatus === 'Out of Stock') {
                statusBgColor = COLORS.LIGHT_RED;
                statusTextColor = COLORS.DANGER;
            }
            
            styleCell(statusCell, {
                bgColor: statusBgColor,
                color: statusTextColor,
                bold: true,
                alignment: { horizontal: 'center' }
            });
        } catch (error) {
            console.error(`Error processing material ${material.itemCode || 'unknown'}:`, error);
        }
    });
    
    // Add total row
    if (materials.length > 0) {
        // Calculate the actual last row number (header + materials)
        const firstDataRow = 3; // Row where data starts (after title, date, and header)
        const lastDataRow = firstDataRow + materials.length - 1;
        
        console.log(`Adding total row. Data rows: ${firstDataRow} to ${lastDataRow}`);
        
        const totalRow = worksheet.addRow([
            'TOTAL', '', '', '',
            { formula: `SUM(E${firstDataRow}:E${lastDataRow})` },
            { formula: `SUM(F${firstDataRow}:F${lastDataRow})` },
            { formula: `SUM(G${firstDataRow}:G${lastDataRow})` },
            { formula: `SUM(H${firstDataRow}:H${lastDataRow})` },
            '', ''
        ]);
        
        // Style total row
        totalRow.eachCell((cell, colNumber) => {
            styleCell(cell, {
                bold: true,
                bgColor: COLORS.LIGHT_GRAY,
                numFmt: colNumber >= 5 && colNumber <= 8 ? '#,##0.00' : undefined
            });
        });
        
        // Merge first 4 cells for the "TOTAL" label
        worksheet.mergeCells(totalRow.number, 1, totalRow.number, 4);
    }
    
    // Set up print settings
    worksheet.pageSetup = {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        paperSize: 9, // A4
        margins: {
            left: 0.25,
            right: 0.25,
            top: 0.75,
            bottom: 0.75,
            header: 0.3,
            footer: 0.3
        }
    };
    
    // Freeze header row
    worksheet.views = [{
        state: 'frozen',
        ySplit: headerRow.number,
        activeCell: 'A1'
    }];
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            maxLength = Math.max(maxLength, columnLength);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    
    return worksheet;
}

/**
 * Create a worksheet for material transactions
 */
function createMaterialWorksheet(workbook, material) {
    const worksheet = workbook.addWorksheet(material.itemCode || 'Transactions');
    
    // Add material info
    const titleRow = worksheet.addRow([`${material.name} (${material.itemCode || 'N/A'})`]);
    titleRow.font = { bold: true, size: 14, color: { argb: COLORS.PRIMARY } };
    worksheet.mergeCells(`A1:G1`);
    
    // Add summary info
    const summaryHeaders = ['Opening', 'Received', 'Issued', 'Closing'];
    const summaryValues = [
        material.openingBalance || 0,
        material.received || 0,
        material.issued || 0,
        material.closingBalance || 0
    ];
    
    // Add summary table
    const summaryRow = worksheet.addRow([]);
    summaryHeaders.forEach((header, index) => {
        const headerCell = worksheet.getCell(3, index * 2 + 1);
        headerCell.value = header;
        styleCell(headerCell, { bold: true, bgColor: COLORS.LIGHT_GRAY });
        
        const valueCell = worksheet.getCell(3, index * 2 + 2);
        valueCell.value = summaryValues[index];
        styleCell(valueCell, { 
            numFmt: '#,##0.00',
            bgColor: COLORS.LIGHT_GRAY,
            bold: index === summaryHeaders.length - 1
        });
    });
    
    // Add transactions header
    const headers = ['Date', 'Type', 'Reference', 'Product', 'Quantity', 'Balance', 'Remarks'];
    const headerRow = worksheet.addRow(headers);
    
    // Style header row
    headerRow.eachCell(cell => {
        styleCell(cell, {
            bold: true,
            color: COLORS.WHITE,
            bgColor: COLORS.PRIMARY,
            alignment: { horizontal: 'center' }
        });
    });
    
    // Add transactions
    let runningBalance = material.openingBalance || 0;
    (material.transactions || []).forEach((txn, index) => {
        const rowNum = 6 + index;
        const quantity = txn.quantity || 0;
        runningBalance += txn.type === 'IN' ? quantity : -quantity;
        
        const row = worksheet.addRow([
            txn.date ? format(new Date(txn.date), 'PP') : 'N/A',
            txn.type || 'N/A',
            txn.reference || 'N/A',
            txn.product || 'N/A',
            quantity,
            runningBalance,
            txn.remarks || ''
        ]);
        
        // Style quantity and balance columns
        ['E', 'F'].forEach(col => {
            const cell = row.getCell(col);
            cell.numFmt = '#,##0.00';
            
            if (col === 'E') { // Quantity column
                cell.font = {
                    color: { argb: txn.type === 'IN' ? COLORS.SUCCESS : COLORS.DANGER }
                };
            } else { // Balance column
                cell.font = { bold: true };
            }
        });
    });
    
    // Set column widths
    const columnWidths = [15, 10, 15, 20, 15, 15, 30];
    columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
    });
    
    // Freeze header row
    worksheet.views = [{
        state: 'frozen',
        ySplit: 5, // Freeze first 5 rows (title, summary, and header)
        activeCell: 'A1'
    }];
    
    return worksheet;
}

/**
 * Main function to add stock balance data to an Excel workbook
 */
async function addStockBalanceToExcel(workbook, reportData) {
    try {
        console.log('=== STARTING STOCK BALANCE EXCEL GENERATION ===');
        
        // Log the incoming reportData structure
        console.log('=== REPORT DATA STRUCTURE ===');
        console.log('Top-level keys:', Object.keys(reportData));
        
        // Check for materials in the expected structure from the report generator
        let materials = [];
        let summary = {};
        
        // The report generator returns { summary: {...}, materials: [...] }
        if (reportData.summary && Array.isArray(reportData.materials)) {
            console.log('Using materials from reportData.materials');
            materials = reportData.materials;
            summary = reportData.summary;
            
            // Log the first material's structure for debugging
            if (materials.length > 0) {
                console.log('First material structure:', {
                    _id: materials[0]._id,
                    itemCode: materials[0].itemCode,
                    name: materials[0].name,
                    unit: materials[0].unit,
                    currentStock: materials[0].currentStock,
                    status: materials[0].status,
                    hasTransactions: Array.isArray(materials[0].transactions),
                    transactionCount: materials[0].transactions?.length || 0
                });
            }
        } 
        // Legacy support for direct materials array
        else if (Array.isArray(reportData)) {
            console.log('Report data is an array, using it as materials');
            materials = reportData;
        }
        // Check if materials array exists in the root
        else if (Array.isArray(reportData.materials)) {
            console.log('Found materials array in reportData.materials');
            materials = reportData.materials;
        }
        // Check if filteredMaterials exists (legacy support)
        else if (Array.isArray(reportData.filteredMaterials)) {
            console.log('Using filteredMaterials array (legacy)');
            materials = reportData.filteredMaterials;
        }
        
        console.log(`Found ${materials.length} materials to process`);
        if (materials.length > 0) {
            console.log('First material sample:', {
                itemCode: materials[0].itemCode,
                name: materials[0].name,
                unit: materials[0].unit,
                currentStock: materials[0].currentStock,
                openingBalance: materials[0].openingBalance,
                received: materials[0].received,
                issued: materials[0].issued,
                closingBalance: materials[0].closingBalance,
                status: materials[0].status,
                hasTransactions: Array.isArray(materials[0].transactions)
            });
        } else {
            console.log('No materials found in the report data');
            console.log('Report data structure:', JSON.stringify(reportData, null, 2));
        }
        
        console.log('=== CREATING SUMMARY WORKSHEET ===');
        // Create summary worksheet with the materials and summary
        const summaryData = {
            ...reportData,
            materials: materials, // Ensure materials is set
            summary: summary,     // Use the summary we extracted
            startDate: summary.startDate || reportData.startDate,
            endDate: summary.endDate || reportData.endDate
        };
        
        console.log('Creating summary worksheet with data:', {
            materialsCount: materials.length,
            hasSummary: !!summary,
            startDate: summaryData.startDate,
            endDate: summaryData.endDate,
            summaryKeys: summary ? Object.keys(summary) : 'No summary',
            firstMaterialKeys: materials[0] ? Object.keys(materials[0]) : 'No materials'
        });
        
        // Log the first material's data for debugging
        if (materials.length > 0) {
            console.log('First material data for worksheet:', {
                itemCode: materials[0].itemCode,
                name: materials[0].name,
                unit: materials[0].unit,
                openingBalance: materials[0].openingBalance,
                received: materials[0].received,
                issued: materials[0].issued,
                closingBalance: materials[0].closingBalance,
                status: materials[0].status,
                lastTransaction: materials[0].lastTransaction
            });
        }
        
        const summaryWorksheet = createSummaryWorksheet(workbook, summaryData);
        console.log('Summary worksheet created with name:', summaryWorksheet.name);
        
        // Verify the worksheet has data
        console.log(`Worksheet row count: ${summaryWorksheet.rowCount}`);
        
        // Process individual material worksheets
        console.log(`Processing ${materials.length} materials for individual worksheets`);
        
        let materialCount = 0;
        for (const material of materials) {
            try {
                const hasTransactions = material.transactions && material.transactions.length > 0;
                console.log(`Processing material ${material.itemCode || material._id || 'unknown'}:`, {
                    name: material.name,
                    hasTransactions: hasTransactions,
                    transactionCount: hasTransactions ? material.transactions.length : 0,
                    status: material.status
                });
                
                if (hasTransactions) {
                    await createMaterialWorksheet(workbook, material);
                    materialCount++;
                } else {
                    console.log(`Skipping material ${material.itemCode || material._id || 'unknown'} - no transactions`);
                }
            } catch (error) {
                console.error(`Error processing material ${material._id || 'unknown'}:`, error);
                // Log detailed error information
                console.error('Material data that caused error:', {
                    id: material._id,
                    itemCode: material.itemCode,
                    name: material.name,
                    hasTransactions: !!(material.transactions && material.transactions.length > 0),
                    transactionCount: material.transactions ? material.transactions.length : 0
                });
                // Continue with next material if one fails
            }
        }
        
        console.log(`Created ${materialCount} material worksheets`);
        
        // Set the first worksheet as active
        if (workbook.worksheets.length > 0) {
            console.log(`Setting active worksheet: ${workbook.worksheets[0].name}`);
            workbook.worksheets[0].state = 'visible';
        } else {
            console.warn('No worksheets were created in the workbook!');
        }
        
        console.log('=== EXCEL GENERATION COMPLETE ===');
        return workbook;
        
    } catch (error) {
        console.error('CRITICAL ERROR in addStockBalanceToExcel:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            reportDataKeys: reportData ? Object.keys(reportData) : 'No reportData'
        });
        throw error;
    }
}

module.exports = { addStockBalanceToExcel };
