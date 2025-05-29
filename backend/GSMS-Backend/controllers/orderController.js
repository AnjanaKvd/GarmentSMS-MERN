const Order = require('../models/Order');
const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');

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
    const { poNo, productId, quantity } = req.body;
    
    // Validate inputs
    if (!poNo || !productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        message: 'PO number, product ID, and valid quantity are required'
      });
    }
    
    // Check if order with same PO number exists
    const existingOrder = await Order.findOne({ poNo });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order with this PO number already exists' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ message: 'Product not found' });
    }
    
    // Calculate initial consumption report based on BOM
    const consumptionReport = product.materialsRequired.map(material => ({
      materialId: material.materialId,
      requiredQty: material.quantityPerPiece * quantity,
      actualUsedQty: 0,
      wastage: 0
    }));
    
    const newOrder = new Order({
      poNo,
      productId,
      quantity,
      orderDate: new Date(),
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

// Get material usage for an order
exports.getOrderUsage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId')
      .populate('consumptionReport.materialId');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Format usage report
    const usage = order.consumptionReport.map(item => ({
      materialId: item.materialId._id,
      materialName: item.materialId.name,
      itemCode: item.materialId.itemCode,
      unit: item.materialId.unit,
      requiredQty: item.requiredQty,
      actualUsedQty: item.actualUsedQty,
      wastage: item.wastage,
      currentStock: item.materialId.currentStock,
      wastePercentage: item.actualUsedQty > 0 
        ? ((item.wastage / item.actualUsedQty) * 100).toFixed(2) + '%' 
        : '0%'
    }));
    
    res.status(200).json({
      order: {
        id: order._id,
        poNo: order.poNo,
        product: order.productId.itemName,
        styleNo: order.productId.styleNo,
        quantity: order.quantity,
        status: order.status
      },
      usage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 