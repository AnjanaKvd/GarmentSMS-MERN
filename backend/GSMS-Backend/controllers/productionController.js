// controllers/productionController.js
const ProductionLog = require('../models/ProductionLog');
const Order = require('../models/Order');
const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const mongoose = require('mongoose');

// Get all production logs
exports.getAllProductionLogs = async (req, res) => {
  try {
    const logs = await ProductionLog.find()
      .populate('orderId', 'poNo')
      .populate('createdBy', 'name')
      .populate('materialUsage.materialId', 'name itemCode')
      .sort({ createdAt: -1 });
    
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get production logs for a specific order
exports.getProductionLogsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const logs = await ProductionLog.find({ orderId })
      .populate('materialUsage.materialId', 'name itemCode unit')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Record production with wastage
exports.recordProduction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId, cutQty, materialUsage, status, remarks } = req.body;
    
    // Validate required fields
    if (!orderId || !cutQty || !materialUsage || materialUsage.length === 0) {
      return res.status(400).json({ 
        message: 'Order ID, cut quantity, and material usage are required' 
      });
    }
    
    // Check if order exists
    const order = await Order.findById(orderId)
      .populate({
        path: 'productId',
        populate: { path: 'materialsRequired.materialId' }
      });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Prepare material usage with wastage calculations
    const processedMaterialUsage = materialUsage.map(material => {
      // Find product's BOM entry for this material
      const bomEntry = order.productId.materialsRequired.find(
        item => item.materialId._id.toString() === material.materialId
      );
      
      // Calculate standard wastage based on BOM expected wastage percentage
      const standardWastagePercentage = bomEntry ? bomEntry.expectedWastagePercentage : 0;
      const standardWastage = (material.usedQty * standardWastagePercentage) / 100;
      
      return {
        materialId: material.materialId,
        usedQty: material.usedQty,
        standardWastage: standardWastage,
        extraWastage: material.extraWastage || 0,
        wastageReason: material.wastageReason || ''
      };
    });
    
    // Create production log
    const productionLog = new ProductionLog({
      orderId,
      cutQty,
      materialUsage: processedMaterialUsage,
      status: status || 'CUTTING',
      remarks,
      createdBy: req.user._id
    });
    
    // Update order consumption report with actual usage and wastage
    for (const material of processedMaterialUsage) {
      const materialId = material.materialId;
      const reportEntry = order.consumptionReport.find(
        item => item.materialId.toString() === materialId
      );
      
      if (reportEntry) {
        reportEntry.actualUsedQty = (reportEntry.actualUsedQty || 0) + material.usedQty;
        reportEntry.standardWastage = (reportEntry.standardWastage || 0) + material.standardWastage;
        reportEntry.extraWastage = (reportEntry.extraWastage || 0) + material.extraWastage;
        reportEntry.wastage = reportEntry.standardWastage + reportEntry.extraWastage;
        reportEntry.wastePercentage = ((reportEntry.wastage / reportEntry.actualUsedQty) * 100).toFixed(2);
      }
    }
    
    // Save production log and update order
    await productionLog.save({ session });
    await order.save({ session });
    
    // Update order status if provided
    if (status) {
      order.status = status === 'COMPLETED' ? 'COMPLETED' : 'PRODUCING';
      await order.save({ session });
    }
    
    await session.commitTransaction();
    
    res.status(201).json(productionLog);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

// Add extra wastage for an order
exports.addExtraWastage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId, materialUsage, remarks } = req.body;
    
    if (!orderId || !materialUsage || materialUsage.length === 0) {
      return res.status(400).json({ 
        message: 'Order ID and material wastage details are required' 
      });
    }
    
    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Calculate cutQty based on materials with "cut" in wastage reason
    // Sum up the extraWastage values for those materials
    const cutQty = materialUsage.reduce((total, material) => {
      if (material.wastageReason && material.wastageReason.toLowerCase().includes('cut')) {
        return total + (material.extraWastage || 0);
      }
      return total;
    }, 0);
    
    // Create production log for extra wastage only
    const productionLog = new ProductionLog({
      orderId,
      cutQty, // Set to the sum of extraWastage for cut-related wastage
      materialUsage: materialUsage.map(material => ({
        materialId: material.materialId,
        usedQty: 0, // No additional usage
        standardWastage: 0, // No standard wastage
        extraWastage: material.extraWastage,
        wastageReason: material.wastageReason || 'Extra wastage added manually'
      })),
      isExtraWastageOnly: true,
      remarks,
      createdBy: req.user._id
    });
    
    // Update order consumption report with extra wastage
    for (const material of materialUsage) {
      const reportEntry = order.consumptionReport.find(
        item => item.materialId.toString() === material.materialId
      );
      
      if (reportEntry) {
        reportEntry.extraWastage = (reportEntry.extraWastage || 0) + material.extraWastage;
        reportEntry.wastage = (reportEntry.standardWastage || 0) + reportEntry.extraWastage;
        reportEntry.wastePercentage = ((reportEntry.wastage / reportEntry.requiredQty) * 100).toFixed(2);
      }
    }
    
    await productionLog.save({ session });
    await order.save({ session });
    
    await session.commitTransaction();
    
    res.status(201).json(productionLog);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

// Update production log
exports.updateProductionLog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { cutQty, materialUsage, status, remarks } = req.body;
    
    const productionLog = await ProductionLog.findById(id);
    if (!productionLog) {
      return res.status(404).json({ message: 'Production log not found' });
    }
    
    // Keep track of old values for order updating
    const oldMaterialUsage = [...productionLog.materialUsage];
    
    // Update production log fields
    if (cutQty !== undefined) productionLog.cutQty = cutQty;
    if (status) productionLog.status = status;
    if (remarks !== undefined) productionLog.remarks = remarks;
    
    // Update material usage and wastage
    if (materialUsage && materialUsage.length > 0) {
      productionLog.materialUsage = materialUsage.map(material => ({
        materialId: material.materialId,
        usedQty: material.usedQty,
        standardWastage: material.standardWastage,
        extraWastage: material.extraWastage || 0,
        wastageReason: material.wastageReason
      }));
    }
    
    // Update order consumption report
    const order = await Order.findById(productionLog.orderId);
    if (order) {
      // Subtract old values
      for (const oldMaterial of oldMaterialUsage) {
        const reportEntry = order.consumptionReport.find(
          item => item.materialId.toString() === oldMaterial.materialId.toString()
        );
        
        if (reportEntry) {
          reportEntry.actualUsedQty -= (oldMaterial.usedQty || 0);
          reportEntry.standardWastage -= (oldMaterial.standardWastage || 0);
          reportEntry.extraWastage -= (oldMaterial.extraWastage || 0);
          reportEntry.wastage = reportEntry.standardWastage + reportEntry.extraWastage;
          reportEntry.wastePercentage = reportEntry.actualUsedQty ? 
            ((reportEntry.wastage / reportEntry.actualUsedQty) * 100).toFixed(2) : '0.00';
        }
      }
      
      // Add new values
      for (const newMaterial of productionLog.materialUsage) {
        const reportEntry = order.consumptionReport.find(
          item => item.materialId.toString() === newMaterial.materialId.toString()
        );
        
        if (reportEntry) {
          reportEntry.actualUsedQty += (newMaterial.usedQty || 0);
          reportEntry.standardWastage += (newMaterial.standardWastage || 0);
          reportEntry.extraWastage += (newMaterial.extraWastage || 0);
          reportEntry.wastage = reportEntry.standardWastage + reportEntry.extraWastage;
          reportEntry.wastePercentage = reportEntry.actualUsedQty ? 
            ((reportEntry.wastage / reportEntry.actualUsedQty) * 100).toFixed(2) : '0.00';
        }
      }
      
      await order.save({ session });
    }
    
    await productionLog.save({ session });
    await session.commitTransaction();
    
    res.status(200).json(productionLog);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

// Delete production log
exports.deleteProductionLog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    const productionLog = await ProductionLog.findById(id);
    if (!productionLog) {
      return res.status(404).json({ message: 'Production log not found' });
    }
    
    // Update order consumption report
    const order = await Order.findById(productionLog.orderId);
    if (order) {
      for (const material of productionLog.materialUsage) {
        const reportEntry = order.consumptionReport.find(
          item => item.materialId.toString() === material.materialId.toString()
        );
        
        if (reportEntry) {
          reportEntry.actualUsedQty -= (material.usedQty || 0);
          reportEntry.standardWastage -= (material.standardWastage || 0);
          reportEntry.extraWastage -= (material.extraWastage || 0);
          reportEntry.wastage = reportEntry.standardWastage + reportEntry.extraWastage;
          reportEntry.wastePercentage = reportEntry.actualUsedQty ? 
            ((reportEntry.wastage / reportEntry.actualUsedQty) * 100).toFixed(2) : '0.00';
        }
      }
      
      await order.save({ session });
    }
    
    await ProductionLog.findByIdAndDelete(id, { session });
    
    await session.commitTransaction();
    
    res.status(200).json({ message: 'Production log deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

// Get wastage analysis
exports.getWastageAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    
    let query = {};
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Filter by product if provided
    if (productId) {
      // First find orders for this product
      const orders = await Order.find({ productId });
      const orderIds = orders.map(order => order._id);
      query.orderId = { $in: orderIds };
    }
    
    // Aggregate wastage data
    const logs = await ProductionLog.find(query)
      .populate('orderId', 'poNo productId quantity')
      .populate({
        path: 'orderId',
        populate: { path: 'productId', select: 'styleNo itemName' }
      })
      .populate('materialUsage.materialId', 'name itemCode unit');
    
    // Analyze wastage by material
    const materialWastageMap = {};
    
    logs.forEach(log => {
      log.materialUsage.forEach(usage => {
        const materialId = usage.materialId._id.toString();
        
        if (!materialWastageMap[materialId]) {
          materialWastageMap[materialId] = {
            materialId,
            materialName: usage.materialId.name,
            itemCode: usage.materialId.itemCode,
            unit: usage.materialId.unit,
            totalUsed: 0,
            standardWastage: 0,
            extraWastage: 0,
            totalWastage: 0,
            wastagePercentage: 0
          };
        }
        
        materialWastageMap[materialId].totalUsed += usage.usedQty;
        materialWastageMap[materialId].standardWastage += usage.standardWastage;
        materialWastageMap[materialId].extraWastage += usage.extraWastage;
        materialWastageMap[materialId].totalWastage += (usage.standardWastage + usage.extraWastage);
      });
    });
    
    // Calculate percentages
    Object.values(materialWastageMap).forEach(material => {
      material.wastagePercentage = material.totalUsed ? 
        ((material.totalWastage / material.totalUsed) * 100).toFixed(2) : '0.00';
    });
    
    res.status(200).json({
      wastageByMaterial: Object.values(materialWastageMap),
      totalLogs: logs.length,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};