const RawMaterial = require('../models/RawMaterial');

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
    const { itemCode, name, unit, currentStock } = req.body;
    
    // Check if material with same item code exists
    const existingMaterial = await RawMaterial.findOne({ itemCode });
    if (existingMaterial) {
      return res.status(400).json({ message: 'Material with this item code already exists' });
    }
    
    const newMaterial = new RawMaterial({
      itemCode,
      name,
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
    const { name, unit } = req.body;
    
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    if (name) material.name = name;
    if (unit) material.unit = unit;
    material.updatedDate = new Date();
    
    await material.save();
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 