const ProductionLog = require('../models/ProductionLog');
const Order = require('../models/Order');
const RawMaterial = require('../models/RawMaterial');

// Get production logs by order ID
exports.getProductionLogsByOrder = async (req, res) => {
  try {
    const productionLogs = await ProductionLog.find({ orderId: req.params.orderId });
    
    if (productionLogs.length === 0) {
      return res.status(404).json({ message: 'No production logs found for this order' });
    }
    
    res.status(200).json(productionLogs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create production log
exports.createProductionLog = async (req, res) => {
  try {
    const { orderId, cutQty, usedFabric, wastageQty, remarks } = req.body;
    
    // Validate inputs
    if (!orderId || !cutQty || !usedFabric || cutQty <= 0 || usedFabric <= 0) {
      return res.status(400).json({ 
        message: 'Order ID, cut quantity, and used fabric are required and must be positive'
      });
    }
    
    // Check if order exists
    const order = await Order.findById(orderId)
      .populate('productId')
      .populate('consumptionReport.materialId');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Create new production log
    const newLog = new ProductionLog({
      orderId,
      cutQty,
      usedFabric,
      wastageQty: wastageQty || 0,
      date: new Date(),
      remarks: remarks || ''
    });
    
    await newLog.save();
    
    // Update order consumption report for the main fabric material
    // Assuming the first material in the BOM is the main fabric
    if (order.consumptionReport && order.consumptionReport.length > 0) {
      const fabricConsumption = order.consumptionReport[0];
      fabricConsumption.actualUsedQty += usedFabric;
      fabricConsumption.wastage += (wastageQty || 0);
      
      // Check if fabric stock needs to be reduced
      const material = await RawMaterial.findById(fabricConsumption.materialId);
      if (material) {
        material.currentStock -= usedFabric;
        material.updatedDate = new Date();
        await material.save();
      }
      
      await order.save();
    }
    
    // Update order status to PRODUCING if it's PENDING
    if (order.status === 'PENDING') {
      order.status = 'PRODUCING';
      await order.save();
    }
    
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get production summary
exports.getProductionSummary = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Check if order exists
    const order = await Order.findById(orderId)
      .populate('productId');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get all production logs for this order
    const logs = await ProductionLog.find({ orderId });
    
    // Calculate summary
    const totalCutQty = logs.reduce((sum, log) => sum + log.cutQty, 0);
    const totalFabricUsed = logs.reduce((sum, log) => sum + log.usedFabric, 0);
    const totalWastage = logs.reduce((sum, log) => sum + log.wastageQty, 0);
    
    const summary = {
      order: {
        poNo: order.poNo,
        product: order.productId.itemName,
        styleNo: order.productId.styleNo,
        quantity: order.quantity,
        status: order.status
      },
      production: {
        totalCutQty,
        totalFabricUsed,
        totalWastage,
        completionPercentage: ((totalCutQty / order.quantity) * 100).toFixed(2) + '%',
        wastagePercentage: ((totalWastage / totalFabricUsed) * 100).toFixed(2) + '%'
      },
      logs
    };
    
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 