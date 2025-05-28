const Order = require('../models/Order');
const RawMaterial = require('../models/RawMaterial');
const ProductionLog = require('../models/ProductionLog');
const Product = require('../models/Product');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get overall material summary
exports.getMaterialSummary = async (req, res) => {
  try {
    const materials = await RawMaterial.find();
    
    // Get total consumption for each material across all orders
    const materialSummary = await Promise.all(materials.map(async (material) => {
      // Find all orders that use this material
      const orders = await Order.find({
        'consumptionReport.materialId': material._id
      });
      
      // Calculate total consumption
      let totalConsumption = 0;
      orders.forEach(order => {
        const materialConsumption = order.consumptionReport.find(
          item => item.materialId.toString() === material._id.toString()
        );
        if (materialConsumption) {
          totalConsumption += materialConsumption.actualUsedQty;
        }
      });
      
      // Calculate total received
      const totalReceived = material.receivedBatches.reduce(
        (sum, batch) => sum + batch.quantity, 0
      );
      
      return {
        id: material._id,
        itemCode: material.itemCode,
        name: material.name,
        unit: material.unit,
        currentStock: material.currentStock,
        totalReceived,
        totalConsumption,
        lastUpdated: material.updatedDate
      };
    }));
    
    res.status(200).json(materialSummary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order-level usage report
exports.getOrdersReport = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('productId')
      .populate('consumptionReport.materialId');
    
    const ordersReport = orders.map(order => {
      // Calculate total material usage and wastage
      let totalUsage = 0;
      let totalWastage = 0;
      
      order.consumptionReport.forEach(item => {
        totalUsage += item.actualUsedQty;
        totalWastage += item.wastage;
      });
      
      return {
        id: order._id,
        poNo: order.poNo,
        product: order.productId.itemName,
        styleNo: order.productId.styleNo,
        quantity: order.quantity,
        status: order.status,
        orderDate: order.orderDate,
        totalUsage,
        totalWastage,
        wastagePercentage: totalUsage > 0 
          ? ((totalWastage / totalUsage) * 100).toFixed(2) + '%' 
          : '0%',
        materials: order.consumptionReport.map(item => ({
          name: item.materialId.name,
          requiredQty: item.requiredQty,
          actualUsedQty: item.actualUsedQty,
          wastage: item.wastage
        }))
      };
    });
    
    res.status(200).json(ordersReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export PDF report
exports.exportPDF = async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    const order = await Order.findById(orderId)
      .populate('productId')
      .populate('consumptionReport.materialId');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get production logs
    const logs = await ProductionLog.find({ orderId });
    
    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order.poNo}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text(`Order Report: ${order.poNo}`, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Product: ${order.productId.itemName} (${order.productId.styleNo})`);
    doc.text(`Quantity: ${order.quantity}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Order Date: ${order.orderDate.toLocaleDateString()}`);
    doc.moveDown();
    
    // Material consumption table
    doc.fontSize(14).text('Material Consumption', { underline: true });
    doc.moveDown();
    
    let yPos = doc.y;
    
    // Table headers
    doc.fontSize(10).text('Material', 50, yPos);
    doc.text('Required', 200, yPos);
    doc.text('Used', 300, yPos);
    doc.text('Wastage', 400, yPos);
    
    yPos += 20;
    
    // Table rows
    order.consumptionReport.forEach(item => {
      doc.text(item.materialId.name, 50, yPos);
      doc.text(`${item.requiredQty} ${item.materialId.unit}`, 200, yPos);
      doc.text(`${item.actualUsedQty} ${item.materialId.unit}`, 300, yPos);
      doc.text(`${item.wastage} ${item.materialId.unit}`, 400, yPos);
      yPos += 20;
    });
    
    doc.moveDown(2);
    
    // Production logs
    doc.fontSize(14).text('Production Logs', { underline: true });
    doc.moveDown();
    
    if (logs.length === 0) {
      doc.text('No production logs available');
    } else {
      logs.forEach((log, index) => {
        doc.fontSize(12).text(`Log #${index + 1} - ${log.date.toLocaleDateString()}`);
        doc.fontSize(10).text(`Cut Quantity: ${log.cutQty}`);
        doc.text(`Used Fabric: ${log.usedFabric}`);
        doc.text(`Wastage: ${log.wastageQty}`);
        if (log.remarks) doc.text(`Remarks: ${log.remarks}`);
        doc.moveDown();
      });
    }
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export Excel report
exports.exportExcel = async (req, res) => {
  try {
    const { materialId } = req.query;
    
    if (!materialId) {
      return res.status(400).json({ message: 'Material ID is required' });
    }
    
    const material = await RawMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Find all orders that use this material
    const orders = await Order.find({
      'consumptionReport.materialId': material._id
    }).populate('productId');
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Garment SMS';
    workbook.created = new Date();
    
    // Add Material Info sheet
    const infoSheet = workbook.addWorksheet('Material Info');
    
    infoSheet.columns = [
      { header: 'Property', key: 'property', width: 20 },
      { header: 'Value', key: 'value', width: 30 }
    ];
    
    infoSheet.addRows([
      { property: 'Item Code', value: material.itemCode },
      { property: 'Name', value: material.name },
      { property: 'Unit', value: material.unit },
      { property: 'Current Stock', value: material.currentStock },
      { property: 'Last Updated', value: material.updatedDate.toLocaleDateString() }
    ]);
    
    // Add Received Batches sheet
    const batchesSheet = workbook.addWorksheet('Received Batches');
    
    batchesSheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];
    
    material.receivedBatches.forEach(batch => {
      batchesSheet.addRow({
        date: batch.receivedDate.toLocaleDateString(),
        quantity: batch.quantity,
        remarks: batch.remarks || ''
      });
    });
    
    // Add Usage by Order sheet
    const usageSheet = workbook.addWorksheet('Usage by Order');
    
    usageSheet.columns = [
      { header: 'PO Number', key: 'poNo', width: 15 },
      { header: 'Product', key: 'product', width: 20 },
      { header: 'Style No', key: 'styleNo', width: 15 },
      { header: 'Required Qty', key: 'requiredQty', width: 15 },
      { header: 'Actual Used', key: 'actualUsed', width: 15 },
      { header: 'Wastage', key: 'wastage', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    orders.forEach(order => {
      const materialUsage = order.consumptionReport.find(
        item => item.materialId.toString() === material._id.toString()
      );
      
      if (materialUsage) {
        usageSheet.addRow({
          poNo: order.poNo,
          product: order.productId.itemName,
          styleNo: order.productId.styleNo,
          requiredQty: materialUsage.requiredQty,
          actualUsed: materialUsage.actualUsedQty,
          wastage: materialUsage.wastage,
          status: order.status
        });
      }
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=material-${material.itemCode}.xlsx`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 