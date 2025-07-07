const Order = require('../models/Order');
const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const mongoose = require('mongoose');
const ProductionLog = require('../models/ProductionLog');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('productId', 'styleNo itemName')
      .select('-consumptionReport');
      
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId')
      .populate('consumptionReport.materialId');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity, description, orderDate } = req.body;
    
    // Validate inputs
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: 'product ID, and valid quantity are required'
      });
    }
    
    const orderCount = await Order.countDocuments();
    const poNo = `PO${(orderCount + 1).toString().padStart(4, '0')}`;
    
    // Check if product exists
    const product = await Product.findById(productId).populate('materialsRequired.materialId');
    if (!product) {
      return res.status(400).json({ message: 'Product not found' });
    }
    
    // Calculate initial consumption report based on BOM with wastage calculation
    const consumptionReport = product.materialsRequired.map(material => {
      // Calculate required quantity based on product quantity
      const requiredQty = material.quantityPerPiece * quantity;
      
      // Calculate standard wastage based on the expected wastage percentage
      const standardWastage = parseFloat(((requiredQty * (material.expectedWastagePercentage || 0)) / 100).toFixed(4));
      
      // Add material name and item code if available
      let materialName = '';
      let itemCode = '';
      let unit = '';
      
      if (material.materialId) {
        if (typeof material.materialId === 'object') {
          materialName = material.materialId.name || '';
          itemCode = material.materialId.itemCode || '';
          unit = material.materialId.unit || '';
        }
      }
      
      return {
        materialId: material.materialId,
        materialName,
        itemCode,
        unit,
        requiredQty,
        actualUsedQty: parseFloat((requiredQty + standardWastage).toFixed(4)),
        standardWastage,
        extraWastage: 0,
        wastage: standardWastage, // Initial wastage is just the standard wastage
        totalRequiredQty: parseFloat((requiredQty + standardWastage).toFixed(4)), // Add this line
        wastePercentage: standardWastage > 0 ? ((standardWastage / requiredQty) * 100).toFixed(2) : '0.00',
      };
    });
    
    const newOrder = new Order({
      poNo,
      productId,
      quantity,
      description, // Add the description field
      orderDate: orderDate ? new Date(orderDate) : new Date(), // Use provided orderDate if available
      status: 'PENDING',
      consumptionReport
    });
    
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['PENDING', 'PRODUCING', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('consumptionReport.materialId');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If changing to PRODUCING status, check and reduce stock
    if (status === 'PRODUCING') {
      // Check if any material has insufficient stock
      const insufficientMaterials = order.consumptionReport.filter(item => 
        item.materialId.currentStock < item.requiredQty
      );

      if (insufficientMaterials.length > 0) {
        return res.status(400).json({ 
          message: 'Insufficient stock for some materials',
          insufficientMaterials: insufficientMaterials.map(item => ({
            materialName: item.materialId.name,
            requiredQty: item.requiredQty,
            currentStock: item.materialId.currentStock
          }))
        });
      }

      // Reduce stock for all materials
      for (const item of order.consumptionReport) {
        await RawMaterial.findByIdAndUpdate(
          item.materialId._id,
          { $inc: { currentStock: -item.requiredQty } }
        );
      }
    }
    
    order.status = status;
    await order.save();
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get material usage for an order (enhanced with wastage details)
exports.getOrderUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const order = await Order.findById(id)
      .populate('productId', 'styleNo itemName materialsRequired')
      .populate({
        path: 'consumptionReport.materialId',
        select: 'name itemCode unit currentStock'
      });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get all production logs for this order to track wastage history
    const productionLogs = await ProductionLog.find({ orderId: id })
      .populate('materialUsage.materialId', 'name itemCode unit')
      .sort({ date: -1 });
    
    // Format consumption report for frontend
    const usage = order.consumptionReport.map(material => {
      // Get wastage history for this material
      const materialWastageHistory = productionLogs
        .filter(log => log.materialUsage.some(usage => 
          usage.materialId._id.toString() === material.materialId._id.toString() ||
          usage.materialId.toString() === material.materialId._id.toString()
        ))
        .map(log => {
          const materialUsage = log.materialUsage.find(usage => 
            usage.materialId._id.toString() === material.materialId._id.toString() ||
            usage.materialId.toString() === material.materialId._id.toString()
          );
          
          return {
            date: log.date,
            standardWastage: materialUsage?.standardWastage || 0,
            extraWastage: materialUsage?.extraWastage || 0,
            totalWastage: materialUsage?.totalWastage || 0,
            wastageReason: materialUsage?.wastageReason || '',
            isExtraWastageOnly: log.isExtraWastageOnly || false
          };
        });
      
      return {
        materialId: material.materialId?._id || material.materialId,
        materialName: material.materialName || material.materialId?.name || 'Unknown Material',
        itemCode: material.itemCode || material.materialId?.itemCode || 'N/A',
        unit: material.unit || material.materialId?.unit || '',
        requiredQty: material.requiredQty || 0,
        actualUsedQty: material.actualUsedQty || 0,
        currentStock: material.materialId?.currentStock || 0,
        standardWastage: material.standardWastage || 0,
        extraWastage: material.extraWastage || 0,
        wastage: material.wastage || 0,
        totalRequiredQty: material.totalRequiredQty || (material.requiredQty + material.wastage) || 0, // Add this line
        wastePercentage: material.wastePercentage || '0.00',
        wastageHistory: materialWastageHistory
      };
    });
    
    res.json({
      orderId: order._id,
      poNo: order.poNo,
      productId: order.productId._id,
      productName: order.productId.itemName,
      styleNo: order.productId.styleNo,
      quantity: order.quantity,
      status: order.status,
      orderDate: order.orderDate,
      usage,
      productionLogs: productionLogs.map(log => ({
        _id: log._id,
        date: log.date,
        cutQty: log.cutQty,
        isExtraWastageOnly: log.isExtraWastageOnly || false,
        remarks: log.remarks
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete order and associated production logs
exports.deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Delete all production logs associated with this order
    const deletedLogs = await ProductionLog.deleteMany({ orderId: id }, { session });
    
    // Delete the order
    await Order.findByIdAndDelete(id, { session });
    
    await session.commitTransaction();
    
    res.status(200).json({ 
      message: 'Order deleted successfully', 
      deletedProductionLogs: deletedLogs.deletedCount
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

// Update order details
exports.updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, orderDate, quantity } = req.body;
    
    // Validate inputs
    if (quantity && quantity <= 0) {
      return res.status(400).json({ 
        message: 'Quantity must be greater than 0'
      });
    }
    
    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update only the fields that are provided
    if (description !== undefined) {
      order.description = description;
    }
    
    if (orderDate) {
      order.orderDate = new Date(orderDate);
    }
    
    if (quantity) {
      // Only allow quantity update if order is still in PENDING status
      if (order.status !== 'PENDING') {
        return res.status(400).json({ 
          message: 'Cannot update quantity for orders that are already in production or completed'
        });
      }
      
      // Update quantity and recalculate consumption report
      order.quantity = quantity;
      
      // Get the product to recalculate material requirements
      const product = await Product.findById(order.productId).populate('materialsRequired.materialId');
      
      if (product) {
        // Recalculate consumption report based on new quantity
        order.consumptionReport = product.materialsRequired.map(material => {
          // Calculate required quantity based on new product quantity
          const requiredQty = material.quantityPerPiece * quantity;
          
          // Calculate standard wastage based on the expected wastage percentage
          const standardWastage = parseFloat(((requiredQty * (material.expectedWastagePercentage || 0)) / 100).toFixed(4));
          
          // Find existing consumption report item if it exists
          const existingItem = order.consumptionReport.find(
            item => item.materialId.toString() === material.materialId._id.toString()
          );
          
          // Add material name and item code if available
          let materialName = '';
          let itemCode = '';
          let unit = '';
          
          if (material.materialId) {
            if (typeof material.materialId === 'object') {
              materialName = material.materialId.name || '';
              itemCode = material.materialId.itemCode || '';
              unit = material.materialId.unit || '';
            }
          }
          
          return {
            materialId: material.materialId,
            materialName: materialName || (existingItem ? existingItem.materialName : ''),
            itemCode: itemCode || (existingItem ? existingItem.itemCode : ''),
            unit: unit || (existingItem ? existingItem.unit : ''),
            requiredQty,
            actualUsedQty: parseFloat((requiredQty + standardWastage).toFixed(4)),
            standardWastage,
            extraWastage: existingItem ? existingItem.extraWastage : 0,
            wastage: standardWastage + (existingItem ? existingItem.extraWastage : 0),
            totalRequiredQty: parseFloat((requiredQty + standardWastage + (existingItem ? existingItem.extraWastage : 0)).toFixed(4)),
            wastePercentage: standardWastage > 0 ? ((standardWastage / requiredQty) * 100).toFixed(2) : '0.00',
          };
        });
      }
    }
    
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};