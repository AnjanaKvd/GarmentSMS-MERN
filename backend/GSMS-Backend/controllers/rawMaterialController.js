const RawMaterial = require('../models/RawMaterial');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get all materials
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await RawMaterial.find();
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single material
exports.getMaterialById = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new material
exports.createMaterial = async (req, res) => {
  try {
    const { itemCode, name, description, unit, currentStock } = req.body;
    
    // Check if material with same item code exists
    const existingMaterial = await RawMaterial.findOne({ itemCode });
    if (existingMaterial) {
      return res.status(400).json({ message: 'Material with this item code already exists' });
    }
    
    const newMaterial = new RawMaterial({
      itemCode,
      name,
      description: description || '',
      unit,
      currentStock: currentStock || 0,
      updatedDate: new Date()
    });
    
    await newMaterial.save();
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add stock batch
exports.addStockBatch = async (req, res) => {
  try {
    const { quantity, remarks } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Add new batch
    material.receivedBatches.push({
      quantity,
      receivedDate: new Date(),
      remarks: remarks || ''
    });
    
    // Update current stock
    material.currentStock += quantity;
    material.updatedDate = new Date();
    
    await material.save();
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update material
exports.updateMaterial = async (req, res) => {
  try {
    const { name, description, unit } = req.body;
    
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    if (name) material.name = name;
    if (description !== undefined) material.description = description;
    if (unit) material.unit = unit;
    material.updatedDate = new Date();
    
    await material.save();
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete material
exports.deleteMaterial = async (req, res) => {
  try {
    const materialId = req.params.id;
    
    // Check if material exists
    const material = await RawMaterial.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Check if material is being used in any products
    const productsUsingMaterial = await Product.find({
      'materialsRequired.materialId': materialId
    });
    
    if (productsUsingMaterial.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete material as it is being used in products',
        products: productsUsingMaterial.map(p => ({ id: p._id, name: p.itemName }))
      });
    }
    
    // Check if material is being used in any orders
    const ordersUsingMaterial = await Order.find({
      'consumptionReport.materialId': materialId
    });
    
    if (ordersUsingMaterial.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete material as it is being used in orders',
        orders: ordersUsingMaterial.map(o => ({ id: o._id, poNo: o.poNo }))
      });
    }
    
    // Delete the material if not in use
    await RawMaterial.findByIdAndDelete(materialId);
    
    res.status(200).json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 