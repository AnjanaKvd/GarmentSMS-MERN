const Order = require('../models/Order');
const RawMaterial = require('../models/RawMaterial');
const ProductionLog = require('../models/ProductionLog');
const Product = require('../models/Product');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

/**
 * Get fabric usage summary by date range or specific order
 */
exports.getFabricUsageSummary = async (req, res) => {
  try {
    const { startDate, endDate, orderId } = req.query;
    
    // Create filter object based on query parameters
    let filter = {};
    
    if (orderId) {
      filter.orderId = orderId;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Get production logs with filter
    const productionLogs = await ProductionLog.find(filter)
      .populate({
        path: 'orderId',
        populate: { path: 'productId' }
      })
      .populate('materialUsage.materialId');
    
    // Calculate fabric usage statistics
    const materialUsageMap = new Map();
    
    productionLogs.forEach(log => {
      log.materialUsage.forEach(usage => {
        if (!usage.materialId) return; // Skip if materialId is null
        
        const materialId = usage.materialId._id.toString();
        
        if (!materialUsageMap.has(materialId)) {
          materialUsageMap.set(materialId, {
            id: materialId,
            name: usage.materialId.name,
            itemCode: usage.materialId.itemCode,
            unit: usage.materialId.unit,
            totalUsage: 0,
            standardWastage: 0,
            extraWastage: 0,
            totalWastage: 0,
            orderUsage: new Map(),
            dateUsage: new Map()
          });
        }
        
        const material = materialUsageMap.get(materialId);
        material.totalUsage += usage.usedQty || 0;
        material.standardWastage += usage.standardWastage || 0;
        material.extraWastage += usage.extraWastage || 0;
        material.totalWastage += usage.totalWastage || 0;
        
        // Track usage by order
        if (log.orderId) {
          const orderId = log.orderId._id.toString();
          if (!material.orderUsage.has(orderId)) {
            material.orderUsage.set(orderId, {
              poNo: log.orderId.poNo || 'Unknown',
              productName: log.orderId.productId ? log.orderId.productId.itemName : 'Unknown',
              styleNo: log.orderId.productId ? log.orderId.productId.styleNo : 'Unknown',
              usage: 0,
              wastage: 0
            });
          }
          material.orderUsage.get(orderId).usage += usage.usedQty || 0;
          material.orderUsage.get(orderId).wastage += usage.totalWastage || 0;
        }
        
        // Track usage by date
        const dateKey = log.date.toISOString().split('T')[0];
        if (!material.dateUsage.has(dateKey)) {
          material.dateUsage.set(dateKey, {
            usage: 0,
            wastage: 0
          });
        }
        material.dateUsage.get(dateKey).usage += usage.usedQty || 0;
        material.dateUsage.get(dateKey).wastage += usage.totalWastage || 0;
      });
    });
    
    // Convert maps to arrays for response
    const fabricUsageSummary = Array.from(materialUsageMap.values()).map(material => ({
      ...material,
      wastePercentage: material.totalUsage > 0 
        ? ((material.totalWastage / material.totalUsage) * 100).toFixed(2)
        : 0,
      orderUsage: Array.from(material.orderUsage.values()),
      dateUsage: Array.from(material.dateUsage.entries()).map(([date, usage]) => ({
        date,
        ...usage
      }))
    }));
    
    res.status(200).json(fabricUsageSummary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get in-out stock balance for all materials or a specific material
 */
exports.getStockBalance = async (req, res) => {
  try {
    const { materialId } = req.query;
    
    let filter = {};
    if (materialId) filter._id = materialId;
    
    const materials = await RawMaterial.find(filter);
    
    const stockBalanceReport = await Promise.all(materials.map(async (material) => {
      // Get all production logs that used this material
      const productionLogs = await ProductionLog.find({
        'materialUsage.materialId': material._id
      });
      
      // Calculate total received, used, and current balance
      const totalReceived = material.receivedBatches.reduce(
        (sum, batch) => sum + batch.quantity, 0
      );
      
      let totalUsed = 0;
      productionLogs.forEach(log => {
        const usage = log.materialUsage.find(
          item => item.materialId && item.materialId.toString() === material._id.toString()
        );
        if (usage) {
          totalUsed += usage.usedQty || 0;
        }
      });
      
      // Get batch history for in-out tracking
      const inOutHistory = [];
      
      // Add received batches to history
      material.receivedBatches.forEach(batch => {
        inOutHistory.push({
          date: batch.receivedDate,
          type: 'IN',
          quantity: batch.quantity,
          remarks: batch.remarks || 'Material received',
          balance: 0 // Will calculate later
        });
      });
      
      // Add usage entries to history
      productionLogs.forEach(log => {
        const usage = log.materialUsage.find(
          item => item.materialId && item.materialId.toString() === material._id.toString()
        );
        if (usage) {
          inOutHistory.push({
            date: log.date,
            type: 'OUT',
            quantity: usage.usedQty || 0,
            remarks: `Used for Order ${log.orderId}`,
            balance: 0 // Will calculate later
          });
        }
      });
      
      // Sort history by date
      inOutHistory.sort((a, b) => a.date - b.date);
      
      // Calculate running balance
      let runningBalance = 0;
      inOutHistory.forEach(entry => {
        if (entry.type === 'IN') {
          runningBalance += entry.quantity;
        } else {
          runningBalance -= entry.quantity;
        }
        entry.balance = runningBalance;
      });
      
      return {
        id: material._id,
        itemCode: material.itemCode,
        name: material.name,
        unit: material.unit,
        totalReceived,
        totalUsed,
        currentBalance: totalReceived - totalUsed,
        lastUpdated: material.updatedDate,
        history: inOutHistory
      };
    }));
    
    res.status(200).json(stockBalanceReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get order fulfillment status report
 */
exports.getOrderFulfillment = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    
    const orders = await Order.find(filter)
      .populate('productId')
      .sort({ orderDate: -1 });
    
    const orderFulfillmentReport = await Promise.all(orders.map(async (order) => {
      // Get production logs for this order
      const productionLogs = await ProductionLog.find({ orderId: order._id });
      
      // Calculate total cut quantity
      const totalCutQty = productionLogs.reduce((sum, log) => sum + (log.cutQty || 0), 0);
      
      // Calculate completion percentage
      const completionPercentage = order.quantity > 0 
        ? Math.min(100, (totalCutQty / order.quantity) * 100)
        : 0;
        
      // Calculate days since order created
      const daysSinceCreated = Math.floor((new Date() - order.orderDate) / (1000 * 60 * 60 * 24));
      
      // Calculate material fulfillment
      const materialFulfillment = order.consumptionReport.map(item => {
        return {
          materialName: item.materialName || 'Unknown',
          required: item.requiredQty || 0,
          used: item.actualUsedQty || 0,
          fulfillmentPercentage: item.requiredQty > 0 
            ? Math.min(100, (item.actualUsedQty / item.requiredQty) * 100)
            : 0
        };
      });
      
      return {
        id: order._id,
        poNo: order.poNo,
        product: order.productId ? order.productId.itemName : 'Unknown',
        styleNo: order.productId ? order.productId.styleNo : 'Unknown',
        quantity: order.quantity,
        cutQuantity: totalCutQty,
        remainingQuantity: Math.max(0, order.quantity - totalCutQty),
        completionPercentage,
        status: order.status,
        orderDate: order.orderDate,
        daysSinceCreated,
        materialFulfillment
      };
    }));
    
    res.status(200).json(orderFulfillmentReport);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get wastage analysis report
 */
exports.getWastageAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Create filter object based on query parameters
    let filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Get production logs with filter
    const productionLogs = await ProductionLog.find(filter)
      .populate({
        path: 'orderId',
        populate: { path: 'productId' }
      })
      .populate('materialUsage.materialId');
    
    // Analyze wastage by material
    const materialWastageMap = new Map();
    
    productionLogs.forEach(log => {
      log.materialUsage.forEach(usage => {
        if (!usage.materialId) return; // Skip if materialId is null
        
        const materialId = usage.materialId._id.toString();
        
        if (!materialWastageMap.has(materialId)) {
          materialWastageMap.set(materialId, {
            id: materialId,
            name: usage.materialId.name,
            itemCode: usage.materialId.itemCode,
            unit: usage.materialId.unit,
            totalUsed: 0,
            standardWastage: 0,
            extraWastage: 0,
            totalWastage: 0,
            wastageReasons: new Map()
          });
        }
        
        const material = materialWastageMap.get(materialId);
        material.totalUsed += usage.usedQty || 0;
        material.standardWastage += usage.standardWastage || 0;
        material.extraWastage += usage.extraWastage || 0;
        material.totalWastage += usage.totalWastage || 0;
        
        // Track wastage reasons
        if (usage.wastageReason) {
          const reason = usage.wastageReason;
          if (!material.wastageReasons.has(reason)) {
            material.wastageReasons.set(reason, 0);
          }
          material.wastageReasons.set(reason, material.wastageReasons.get(reason) + (usage.extraWastage || 0));
        }
      });
    });
    
    // Convert maps to arrays for response
    const wastageAnalysis = Array.from(materialWastageMap.values()).map(material => ({
      ...material,
      standardWastagePercentage: material.totalUsed > 0 
        ? ((material.standardWastage / material.totalUsed) * 100).toFixed(2)
        : 0,
      extraWastagePercentage: material.totalUsed > 0 
        ? ((material.extraWastage / material.totalUsed) * 100).toFixed(2)
        : 0,
      totalWastagePercentage: material.totalUsed > 0 
        ? ((material.totalWastage / material.totalUsed) * 100).toFixed(2)
        : 0,
      wastageReasons: Array.from(material.wastageReasons.entries()).map(([reason, amount]) => ({
        reason,
        amount,
        percentage: material.extraWastage > 0 
          ? ((amount / material.extraWastage) * 100).toFixed(2)
          : 0
      }))
    }));
    
    res.status(200).json(wastageAnalysis);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Export report to Excel format
 */
exports.exportToExcel = async (req, res) => {
  try {
    const { reportType, ...filters } = req.query;
    
    if (!reportType) {
      return res.status(400).json({ message: 'Report type is required' });
    }
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Garment SMS';
    workbook.created = new Date();
    
    let reportData;
    let fileName;
    
    // Generate report data based on type
    switch (reportType) {
      case 'fabric-usage':
        reportData = await generateFabricUsageReport(filters);
        fileName = 'fabric-usage-report';
        await addFabricUsageToExcel(workbook, reportData);
        break;
        
      case 'stock-balance':
        reportData = await generateStockBalanceReport(filters);
        fileName = 'stock-balance-report';
        await addStockBalanceToExcel(workbook, reportData);
        break;
        
      case 'order-fulfillment':
        reportData = await generateOrderFulfillmentReport(filters);
        fileName = 'order-fulfillment-report';
        await addOrderFulfillmentToExcel(workbook, reportData);
        break;
        
      case 'wastage-analysis':
        reportData = await generateWastageAnalysisReport(filters);
        fileName = 'wastage-analysis-report';
        await addWastageAnalysisToExcel(workbook, reportData);
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Export report to PDF format
 */
exports.exportToPDF = async (req, res) => {
  try {
    const { reportType, ...filters } = req.query;
    
    if (!reportType) {
      return res.status(400).json({ message: 'Report type is required' });
    }
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    let reportData;
    let fileName;
    
    // Generate report data based on type
    switch (reportType) {
      case 'fabric-usage':
        reportData = await generateFabricUsageReport(filters);
        fileName = 'fabric-usage-report';
        addFabricUsageToPDF(doc, reportData);
        break;
        
      case 'stock-balance':
        reportData = await generateStockBalanceReport(filters);
        fileName = 'stock-balance-report';
        addStockBalanceToPDF(doc, reportData);
        break;
        
      case 'order-fulfillment':
        reportData = await generateOrderFulfillmentReport(filters);
        fileName = 'order-fulfillment-report';
        addOrderFulfillmentToPDF(doc, reportData);
        break;
        
      case 'wastage-analysis':
        reportData = await generateWastageAnalysisReport(filters);
        fileName = 'wastage-analysis-report';
        addWastageAnalysisToPDF(doc, reportData);
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions for generating report data
async function generateFabricUsageReport(filters) {
  const { startDate, endDate, orderId } = filters;
  
  // Create filter object based on query parameters
  let filter = {};
  
  if (orderId) {
    filter.orderId = orderId;
  }
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  // Get production logs with filter
  const productionLogs = await ProductionLog.find(filter)
    .populate({
      path: 'orderId',
      populate: { path: 'productId' }
    })
    .populate('materialUsage.materialId');
  
  // Calculate fabric usage statistics
  const materialUsageMap = new Map();
  
  productionLogs.forEach(log => {
    log.materialUsage.forEach(usage => {
      if (!usage.materialId) return; // Skip if materialId is null
      
      const materialId = usage.materialId._id.toString();
      
      if (!materialUsageMap.has(materialId)) {
        materialUsageMap.set(materialId, {
          id: materialId,
          name: usage.materialId.name,
          itemCode: usage.materialId.itemCode,
          unit: usage.materialId.unit,
          totalUsage: 0,
          standardWastage: 0,
          extraWastage: 0,
          totalWastage: 0,
          orderUsage: new Map(),
          dateUsage: new Map()
        });
      }
      
      const material = materialUsageMap.get(materialId);
      material.totalUsage += usage.usedQty || 0;
      material.standardWastage += usage.standardWastage || 0;
      material.extraWastage += usage.extraWastage || 0;
      material.totalWastage += usage.totalWastage || 0;
      
      // Track usage by order
      if (log.orderId) {
        const orderId = log.orderId._id.toString();
        if (!material.orderUsage.has(orderId)) {
          material.orderUsage.set(orderId, {
            poNo: log.orderId.poNo || 'Unknown',
            productName: log.orderId.productId ? log.orderId.productId.itemName : 'Unknown',
            styleNo: log.orderId.productId ? log.orderId.productId.styleNo : 'Unknown',
            usage: 0,
            wastage: 0
          });
        }
        material.orderUsage.get(orderId).usage += usage.usedQty || 0;
        material.orderUsage.get(orderId).wastage += usage.totalWastage || 0;
      }
      
      // Track usage by date
      const dateKey = log.date.toISOString().split('T')[0];
      if (!material.dateUsage.has(dateKey)) {
        material.dateUsage.set(dateKey, {
          usage: 0,
          wastage: 0
        });
      }
      material.dateUsage.get(dateKey).usage += usage.usedQty || 0;
      material.dateUsage.get(dateKey).wastage += usage.totalWastage || 0;
    });
  });
  
  // Convert maps to arrays for response
  return Array.from(materialUsageMap.values()).map(material => ({
    ...material,
    wastePercentage: material.totalUsage > 0 
      ? ((material.totalWastage / material.totalUsage) * 100).toFixed(2)
      : 0,
    orderUsage: Array.from(material.orderUsage.values()),
    dateUsage: Array.from(material.dateUsage.entries()).map(([date, usage]) => ({
      date,
      ...usage
    }))
  }));
}

async function generateStockBalanceReport(filters) {
  const { materialId } = filters;
  
  let filter = {};
  if (materialId) filter._id = materialId;
  
  const materials = await RawMaterial.find(filter);
  
  return await Promise.all(materials.map(async (material) => {
    // Get all production logs that used this material
    const productionLogs = await ProductionLog.find({
      'materialUsage.materialId': material._id
    });
    
    // Calculate total received, used, and current balance
    const totalReceived = material.receivedBatches.reduce(
      (sum, batch) => sum + (batch.quantity || 0), 0
    );
    
    let totalUsed = 0;
    productionLogs.forEach(log => {
      const usage = log.materialUsage.find(
        item => item.materialId && item.materialId.toString() === material._id.toString()
      );
      if (usage) {
        totalUsed += usage.usedQty || 0;
      }
    });
    
    // Get batch history for in-out tracking
    const inOutHistory = [];
    
    // Add received batches to history
    material.receivedBatches.forEach(batch => {
      inOutHistory.push({
        date: batch.receivedDate,
        type: 'IN',
        quantity: batch.quantity || 0,
        remarks: batch.remarks || 'Material received',
        balance: 0 // Will calculate later
      });
    });
    
    // Add usage entries to history
    productionLogs.forEach(log => {
      const usage = log.materialUsage.find(
        item => item.materialId && item.materialId.toString() === material._id.toString()
      );
      if (usage) {
        inOutHistory.push({
          date: log.date,
          type: 'OUT',
          quantity: usage.usedQty || 0,
          remarks: `Used for Order ${log.orderId}`,
          balance: 0 // Will calculate later
        });
      }
    });
    
    // Sort history by date
    inOutHistory.sort((a, b) => a.date - b.date);
    
    // Calculate running balance
    let runningBalance = 0;
    inOutHistory.forEach(entry => {
      if (entry.type === 'IN') {
        runningBalance += entry.quantity;
      } else {
        runningBalance -= entry.quantity;
      }
      entry.balance = runningBalance;
    });
    
    return {
      id: material._id,
      itemCode: material.itemCode,
      name: material.name,
      unit: material.unit,
      totalReceived,
      totalUsed,
      currentBalance: totalReceived - totalUsed,
      lastUpdated: material.updatedDate,
      history: inOutHistory
    };
  }));
}

async function generateOrderFulfillmentReport(filters) {
  const { status } = filters;
  
  let filter = {};
  if (status) filter.status = status;
  
  const orders = await Order.find(filter)
    .populate('productId')
    .sort({ orderDate: -1 });
  
  return await Promise.all(orders.map(async (order) => {
    // Get production logs for this order
    const productionLogs = await ProductionLog.find({ orderId: order._id });
    
    // Calculate total cut quantity
    const totalCutQty = productionLogs.reduce((sum, log) => sum + (log.cutQty || 0), 0);
    
    // Calculate completion percentage
    const completionPercentage = order.quantity > 0 
      ? Math.min(100, (totalCutQty / order.quantity) * 100)
      : 0;
      
    // Calculate days since order created
    const daysSinceCreated = Math.floor((new Date() - order.orderDate) / (1000 * 60 * 60 * 24));
    
    // Calculate material fulfillment
    const materialFulfillment = order.consumptionReport.map(item => {
      return {
        materialName: item.materialName || 'Unknown',
        required: item.requiredQty || 0,
        used: item.actualUsedQty || 0,
        fulfillmentPercentage: item.requiredQty > 0 
          ? Math.min(100, (item.actualUsedQty / item.requiredQty) * 100)
          : 0
      };
    });
    
    return {
      id: order._id,
      poNo: order.poNo,
      product: order.productId ? order.productId.itemName : 'Unknown',
      styleNo: order.productId ? order.productId.styleNo : 'Unknown',
      quantity: order.quantity,
      cutQuantity: totalCutQty,
      remainingQuantity: Math.max(0, order.quantity - totalCutQty),
      completionPercentage,
      status: order.status,
      orderDate: order.orderDate,
      daysSinceCreated,
      materialFulfillment
    };
  }));
}

async function generateWastageAnalysisReport(filters) {
  const { startDate, endDate } = filters;
  
  // Create filter object based on query parameters
  let filter = {};
  
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  // Get production logs with filter
  const productionLogs = await ProductionLog.find(filter)
    .populate({
      path: 'orderId',
      populate: { path: 'productId' }
    })
    .populate('materialUsage.materialId');
  
  // Analyze wastage by material
  const materialWastageMap = new Map();
  
  productionLogs.forEach(log => {
    log.materialUsage.forEach(usage => {
      if (!usage.materialId) return; // Skip if materialId is null
      
      const materialId = usage.materialId._id.toString();
      
      if (!materialWastageMap.has(materialId)) {
        materialWastageMap.set(materialId, {
          id: materialId,
          name: usage.materialId.name,
          itemCode: usage.materialId.itemCode,
          unit: usage.materialId.unit,
          totalUsed: 0,
          standardWastage: 0,
          extraWastage: 0,
          totalWastage: 0,
          wastageReasons: new Map()
        });
      }
      
      const material = materialWastageMap.get(materialId);
      material.totalUsed += usage.usedQty || 0;
      material.standardWastage += usage.standardWastage || 0;
      material.extraWastage += usage.extraWastage || 0;
      material.totalWastage += usage.totalWastage || 0;
      
      // Track wastage reasons
      if (usage.wastageReason) {
        const reason = usage.wastageReason;
        if (!material.wastageReasons.has(reason)) {
          material.wastageReasons.set(reason, 0);
        }
        material.wastageReasons.set(reason, material.wastageReasons.get(reason) + (usage.extraWastage || 0));
      }
    });
  });
  
  // Convert maps to arrays for response
  return Array.from(materialWastageMap.values()).map(material => ({
    ...material,
    standardWastagePercentage: material.totalUsed > 0 
      ? ((material.standardWastage / material.totalUsed) * 100).toFixed(2)
      : 0,
    extraWastagePercentage: material.totalUsed > 0 
      ? ((material.extraWastage / material.totalUsed) * 100).toFixed(2)
      : 0,
    totalWastagePercentage: material.totalUsed > 0 
      ? ((material.totalWastage / material.totalUsed) * 100).toFixed(2)
      : 0,
    wastageReasons: Array.from(material.wastageReasons.entries()).map(([reason, amount]) => ({
      reason,
      amount,
      percentage: material.extraWastage > 0 
        ? ((amount / material.extraWastage) * 100).toFixed(2)
        : 0
    }))
  }));
}

// Helper functions for Excel export
async function addFabricUsageToExcel(workbook, reportData) {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Fabric Usage Summary');
  
  summarySheet.columns = [
    { header: 'Item Code', key: 'itemCode', width: 15 },
    { header: 'Material Name', key: 'name', width: 25 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Total Usage', key: 'totalUsage', width: 15 },
    { header: 'Standard Wastage', key: 'standardWastage', width: 18 },
    { header: 'Extra Wastage', key: 'extraWastage', width: 18 },
    { header: 'Total Wastage', key: 'totalWastage', width: 15 },
    { header: 'Waste %', key: 'wastePercentage', width: 10 }
  ];
  
  // Add summary data
  reportData.forEach(material => {
    summarySheet.addRow({
      itemCode: material.itemCode,
      name: material.name,
      unit: material.unit,
      totalUsage: material.totalUsage,
      standardWastage: material.standardWastage,
      extraWastage: material.extraWastage,
      totalWastage: material.totalWastage,
      wastePercentage: material.wastePercentage + '%'
    });
  });
  
  // Add detail sheets for each material
  reportData.forEach(material => {
    // Usage by order sheet
    const orderSheet = workbook.addWorksheet(`${material.itemCode} - By Order`);
    
    orderSheet.columns = [
      { header: 'PO Number', key: 'poNo', width: 15 },
      { header: 'Product', key: 'productName', width: 25 },
      { header: 'Style No', key: 'styleNo', width: 15 },
      { header: 'Usage', key: 'usage', width: 15 },
      { header: 'Wastage', key: 'wastage', width: 15 },
      { header: 'Wastage %', key: 'wastagePercentage', width: 12 }
    ];
    
    material.orderUsage.forEach(order => {
      orderSheet.addRow({
        poNo: order.poNo,
        productName: order.productName,
        styleNo: order.styleNo,
        usage: order.usage,
        wastage: order.wastage,
        wastagePercentage: order.usage > 0 
          ? ((order.wastage / order.usage) * 100).toFixed(2) + '%'
          : '0%'
      });
    });
    
    // Usage by date sheet
    const dateSheet = workbook.addWorksheet(`${material.itemCode} - By Date`);
    
    dateSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Usage', key: 'usage', width: 15 },
      { header: 'Wastage', key: 'wastage', width: 15 },
      { header: 'Wastage %', key: 'wastagePercentage', width: 12 }
    ];
    
    material.dateUsage.forEach(day => {
      dateSheet.addRow({
        date: day.date,
        usage: day.usage,
        wastage: day.wastage,
        wastagePercentage: day.usage > 0 
          ? ((day.wastage / day.usage) * 100).toFixed(2) + '%'
          : '0%'
      });
    });
  });
}

async function addStockBalanceToExcel(workbook, reportData) {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Stock Balance Summary');
  
  summarySheet.columns = [
    { header: 'Item Code', key: 'itemCode', width: 15 },
    { header: 'Material Name', key: 'name', width: 25 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Total Received', key: 'totalReceived', width: 15 },
    { header: 'Total Used', key: 'totalUsed', width: 15 },
    { header: 'Current Balance', key: 'currentBalance', width: 15 },
    { header: 'Last Updated', key: 'lastUpdated', width: 18 }
  ];
  
  // Add summary data
  reportData.forEach(material => {
    summarySheet.addRow({
      itemCode: material.itemCode,
      name: material.name,
      unit: material.unit,
      totalReceived: material.totalReceived,
      totalUsed: material.totalUsed,
      currentBalance: material.currentBalance,
      lastUpdated: new Date(material.lastUpdated).toLocaleDateString()
    });
  });
  
  // Add transaction history sheets for each material
  reportData.forEach(material => {
    const historySheet = workbook.addWorksheet(`${material.itemCode} - History`);
    
    historySheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Balance', key: 'balance', width: 15 }
    ];
    
    material.history.forEach(entry => {
      historySheet.addRow({        date: new Date(entry.date).toLocaleDateString(),
        type: entry.type,
        quantity: entry.quantity,
        remarks: entry.remarks,
        balance: entry.balance
      });
    });
  });
}

async function addOrderFulfillmentToExcel(workbook, reportData) {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Order Fulfillment Summary');
  
  summarySheet.columns = [
    { header: 'PO Number', key: 'poNo', width: 15 },
    { header: 'Product', key: 'product', width: 25 },
    { header: 'Style No', key: 'styleNo', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 15 },
    { header: 'Cut Quantity', key: 'cutQuantity', width: 15 },
    { header: 'Remaining', key: 'remainingQuantity', width: 15 },
    { header: 'Completion %', key: 'completionPercentage', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Order Date', key: 'orderDate', width: 15 },
    { header: 'Days Active', key: 'daysSinceCreated', width: 15 }
  ];
  
  // Add summary data
  reportData.forEach(order => {
    summarySheet.addRow({
      poNo: order.poNo,
      product: order.product,
      styleNo: order.styleNo,
      quantity: order.quantity,
      cutQuantity: order.cutQuantity,
      remainingQuantity: order.remainingQuantity,
      completionPercentage: order.completionPercentage.toFixed(2) + '%',
      status: order.status,
      orderDate: new Date(order.orderDate).toLocaleDateString(),
      daysSinceCreated: order.daysSinceCreated
    });
  });
  
  // Add material fulfillment sheets for each order
  reportData.forEach(order => {
    const materialSheet = workbook.addWorksheet(`${order.poNo} - Materials`);
    
    materialSheet.columns = [
      { header: 'Material', key: 'materialName', width: 25 },
      { header: 'Required', key: 'required', width: 15 },
      { header: 'Used', key: 'used', width: 15 },
      { header: 'Fulfillment %', key: 'fulfillmentPercentage', width: 15 }
    ];
    
    order.materialFulfillment.forEach(material => {
      materialSheet.addRow({
        materialName: material.materialName,
        required: material.required,
        used: material.used,
        fulfillmentPercentage: material.fulfillmentPercentage.toFixed(2) + '%'
      });
    });
  });
}

async function addWastageAnalysisToExcel(workbook, reportData) {
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Wastage Analysis Summary');
  
  summarySheet.columns = [
    { header: 'Item Code', key: 'itemCode', width: 15 },
    { header: 'Material Name', key: 'name', width: 25 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Total Used', key: 'totalUsed', width: 15 },
    { header: 'Standard Wastage', key: 'standardWastage', width: 15 },
    { header: 'Standard %', key: 'standardWastagePercentage', width: 15 },
    { header: 'Extra Wastage', key: 'extraWastage', width: 15 },
    { header: 'Extra %', key: 'extraWastagePercentage', width: 15 },
    { header: 'Total Wastage', key: 'totalWastage', width: 15 },
    { header: 'Total %', key: 'totalWastagePercentage', width: 15 }
  ];
  
  // Add summary data
  reportData.forEach(material => {
    summarySheet.addRow({
      itemCode: material.itemCode,
      name: material.name,
      unit: material.unit,
      totalUsed: material.totalUsed,
      standardWastage: material.standardWastage,
      standardWastagePercentage: material.standardWastagePercentage + '%',
      extraWastage: material.extraWastage,
      extraWastagePercentage: material.extraWastagePercentage + '%',
      totalWastage: material.totalWastage,
      totalWastagePercentage: material.totalWastagePercentage + '%'
    });
  });
  
  // Add wastage reason sheets for each material
  reportData.forEach(material => {
    if (material.wastageReasons && material.wastageReasons.length > 0) {
      const reasonSheet = workbook.addWorksheet(`${material.itemCode} - Reasons`);
      
      reasonSheet.columns = [
        { header: 'Reason', key: 'reason', width: 30 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 }
      ];
      
      material.wastageReasons.forEach(reason => {
        reasonSheet.addRow({
          reason: reason.reason,
          amount: reason.amount,
          percentage: reason.percentage + '%'
        });
      });
    }
  });
}

// Helper functions for PDF export
function addFabricUsageToPDF(doc, reportData) {
  // Add title
  doc.fontSize(20).text('Fabric Usage Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary table
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown();
  
  // Table headers
  let yPos = doc.y;
  const col1 = 50, col2 = 180, col3 = 290, col4 = 400, col5 = 500;
  
  doc.fontSize(10);
  doc.text('Material', col1, yPos);
  doc.text('Total Usage', col2, yPos);
  doc.text('Wastage', col3, yPos);
  doc.text('Waste %', col4, yPos);
  
  yPos += 20;
  
  // Draw header line
  doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
  
  // Table rows
  reportData.forEach(material => {
    doc.text(material.name, col1, yPos);
    doc.text(`${material.totalUsage} ${material.unit}`, col2, yPos);
    doc.text(`${material.totalWastage} ${material.unit}`, col3, yPos);
    doc.text(`${material.wastePercentage}%`, col4, yPos);
    
    yPos += 20;
    
    // Check if we need a new page
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
  });
  
  // Add material details - one per page
  reportData.forEach(material => {
    doc.addPage();
    
    doc.fontSize(16).text(`Material Detail: ${material.name} (${material.itemCode})`, { underline: true });
    doc.moveDown();
    
    // Usage by order
    doc.fontSize(12).text('Usage by Order', { underline: true });
    doc.moveDown();
    
    yPos = doc.y;
    doc.fontSize(10);
    doc.text('PO Number', col1, yPos);
    doc.text('Product', col2, yPos);
    doc.text('Usage', col3, yPos);
    doc.text('Wastage', col4, yPos);
    
    yPos += 20;
    
    // Draw header line
    doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
    
    material.orderUsage.forEach(order => {
      doc.text(order.poNo, col1, yPos);
      doc.text(order.productName, col2, yPos);
      doc.text(`${order.usage} ${material.unit}`, col3, yPos);
      doc.text(`${order.wastage} ${material.unit}`, col4, yPos);
      
      yPos += 20;
      
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
        
        doc.fontSize(10);
        doc.text('PO Number', col1, yPos);
        doc.text('Product', col2, yPos);
        doc.text('Usage', col3, yPos);
        doc.text('Wastage', col4, yPos);
        
        yPos += 20;
        
        // Draw header line
        doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
      }
    });
  });
}

function addStockBalanceToPDF(doc, reportData) {
  // Add title
  doc.fontSize(20).text('Stock Balance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary table
  doc.fontSize(16).text('Stock Summary', { underline: true });
  doc.moveDown();
  
  // Table headers
  let yPos = doc.y;
  const col1 = 50, col2 = 180, col3 = 290, col4 = 400, col5 = 500;
  
  doc.fontSize(10);
  doc.text('Material', col1, yPos);
  doc.text('Total Received', col2, yPos);
  doc.text('Total Used', col3, yPos);
  doc.text('Current Balance', col4, yPos);
  
  yPos += 20;
  
  // Draw header line
  doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
  
  // Table rows
  reportData.forEach(material => {
    doc.text(material.name, col1, yPos);
    doc.text(`${material.totalReceived} ${material.unit}`, col2, yPos);
    doc.text(`${material.totalUsed} ${material.unit}`, col3, yPos);
    doc.text(`${material.currentBalance} ${material.unit}`, col4, yPos);
    
    yPos += 20;
    
    // Check if we need a new page
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
  });
  
  // Add transaction history for each material
  reportData.forEach(material => {
    doc.addPage();
    
    doc.fontSize(16).text(`Transaction History: ${material.name} (${material.itemCode})`, { underline: true });
    doc.moveDown();
    
    yPos = doc.y;
    doc.fontSize(10);
    doc.text('Date', col1, yPos);
    doc.text('Type', col2, yPos);
    doc.text('Quantity', col3, yPos);
    doc.text('Balance', col4, yPos);
    
    yPos += 20;
    
    // Draw header line
    doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
    
    material.history.forEach(entry => {
      doc.text(new Date(entry.date).toLocaleDateString(), col1, yPos);
      doc.text(entry.type, col2, yPos);
      doc.text(`${entry.quantity} ${material.unit}`, col3, yPos);
      doc.text(`${entry.balance} ${material.unit}`, col4, yPos);
      
      yPos += 20;
      
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
        
        doc.fontSize(10);
        doc.text('Date', col1, yPos);
        doc.text('Type', col2, yPos);
        doc.text('Quantity', col3, yPos);
        doc.text('Balance', col4, yPos);
        
        yPos += 20;
        
        // Draw header line
        doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
      }
    });
  });
}

function addOrderFulfillmentToPDF(doc, reportData) {
  // Add title
  doc.fontSize(20).text('Order Fulfillment Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary table
  doc.fontSize(16).text('Orders Summary', { underline: true });
  doc.moveDown();
  
  // Table headers
  let yPos = doc.y;
  const col1 = 50, col2 = 180, col3 = 290, col4 = 400, col5 = 500;
  
  doc.fontSize(10);
  doc.text('PO Number', col1, yPos);
  doc.text('Product', col2, yPos);
  doc.text('Progress', col3, yPos);
  doc.text('Status', col4, yPos);
  
  yPos += 20;
  
  // Draw header line
  doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
  
  // Table rows
  reportData.forEach(order => {
    doc.text(order.poNo, col1, yPos);
    doc.text(`${order.product} (${order.styleNo})`, col2, yPos);
    doc.text(`${order.completionPercentage.toFixed(2)}%`, col3, yPos);
    doc.text(order.status, col4, yPos);
    
    yPos += 20;
    
    // Check if we need a new page
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
  });
  
  // Add detail page for each order
  reportData.forEach(order => {
    doc.addPage();
    
    doc.fontSize(16).text(`Order Detail: ${order.poNo}`, { underline: true });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Product: ${order.product} (${order.styleNo})`);
    doc.text(`Quantity: ${order.quantity}`);
    doc.text(`Cut Quantity: ${order.cutQuantity}`);
    doc.text(`Remaining: ${order.remainingQuantity}`);
    doc.text(`Completion: ${order.completionPercentage.toFixed(2)}%`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
    doc.text(`Days Active: ${order.daysSinceCreated}`);
    doc.moveDown();
    
    // Material fulfillment
    doc.fontSize(14).text('Material Fulfillment', { underline: true });
    doc.moveDown();
    
    yPos = doc.y;
    doc.fontSize(10);
    doc.text('Material', col1, yPos);
    doc.text('Required', col2, yPos);
    doc.text('Used', col3, yPos);
    doc.text('Fulfillment %', col4, yPos);
    
    yPos += 20;
    
    // Draw header line
    doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
    
    order.materialFulfillment.forEach(material => {
      doc.text(material.materialName, col1, yPos);
      doc.text(`${material.required}`, col2, yPos);
      doc.text(`${material.used}`, col3, yPos);
      doc.text(`${material.fulfillmentPercentage.toFixed(2)}%`, col4, yPos);
      
      yPos += 20;
      
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
        
        doc.fontSize(10);
        doc.text('Material', col1, yPos);
        doc.text('Required', col2, yPos);
        doc.text('Used', col3, yPos);
        doc.text('Fulfillment %', col4, yPos);
        
        yPos += 20;
        
        // Draw header line
        doc.moveTo(col1, yPos - 5).lineTo(col5, yPos - 5).stroke();
      }
    });
  });
}

function addWastageAnalysisToPDF(doc, reportData) {
  // Add title
  doc.fontSize(20).text('Wastage Analysis Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary table
  doc.fontSize(16).text('Wastage Summary', { underline: true });
  doc.moveDown();
  
  // Table headers
  let yPos = doc.y;
  const col1 = 50, col2 = 150, col3 = 250, col4 = 350, col5 = 450;
  
  doc.fontSize(10);
  doc.text('Material', col1, yPos);
  doc.text('Total Used', col2, yPos);
  doc.text('Total Wastage', col3, yPos);
  doc.text('Standard %', col4, yPos);
  doc.text('Extra %', col5, yPos);
  
  yPos += 20;
  
  // Draw header line
  doc.moveTo(col1, yPos - 5).lineTo(col5 + 50, yPos - 5).stroke();
  
  // Table rows
  reportData.forEach(material => {
    doc.text(material.name, col1, yPos);
    doc.text(`${material.totalUsed} ${material.unit}`, col2, yPos);
    doc.text(`${material.totalWastage} ${material.unit}`, col3, yPos);
    doc.text(`${material.standardWastagePercentage}%`, col4, yPos);
    doc.text(`${material.extraWastagePercentage}%`, col5, yPos);
    
    yPos += 20;
    
    // Check if we need a new page
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
  });
  
  // Add wastage reason pages for materials with wastage reasons
  reportData.forEach(material => {
    if (material.wastageReasons && material.wastageReasons.length > 0) {
      doc.addPage();
      
      doc.fontSize(16).text(`Wastage Reasons: ${material.name} (${material.itemCode})`, { underline: true });
      doc.moveDown();
      
      yPos = doc.y;
      doc.fontSize(10);
      doc.text('Reason', col1, yPos);
      doc.text('Amount', col2, yPos);
      doc.text('Percentage', col3, yPos);
      
      yPos += 20;
      
      // Draw header line
      doc.moveTo(col1, yPos - 5).lineTo(col4, yPos - 5).stroke();
      
      material.wastageReasons.forEach(reason => {
        doc.text(reason.reason, col1, yPos);
        doc.text(`${reason.amount} ${material.unit}`, col2, yPos);
        doc.text(`${reason.percentage}%`, col3, yPos);
        
        yPos += 20;
        
        // Check if we need a new page
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
          
          doc.fontSize(10);
          doc.text('Reason', col1, yPos);
          doc.text('Amount', col2, yPos);
          doc.text('Percentage', col3, yPos);
          
          yPos += 20;
          
          // Draw header line
          doc.moveTo(col1, yPos - 5).lineTo(col4, yPos - 5).stroke();
        }
      });
    }
  });
}