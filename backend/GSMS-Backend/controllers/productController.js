const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { styleNo, itemName, description, materialsRequired } = req.body;
    
    // Check if product with same style number exists
    const existingProduct = await Product.findOne({ styleNo });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this style number already exists' });
    }
    
    // Validate materials
    if (materialsRequired && materialsRequired.length > 0) {
      for (const material of materialsRequired) {
        const materialExists = await RawMaterial.findById(material.materialId);
        if (!materialExists) {
          return res.status(400).json({ 
            message: `Material with ID ${material.materialId} does not exist`
          });
        }
        
        if (!material.quantityPerPiece || material.quantityPerPiece <= 0) {
          return res.status(400).json({ 
            message: 'Quantity per piece must be a positive number'
          });
        }
      }
    }
    
    const newProduct = new Product({
      styleNo,
      itemName,
      description: description || '',
      materialsRequired: materialsRequired || []
    });
    
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get BOM for a product
exports.getProductBOM = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('materialsRequired.materialId');
      
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Format BOM with material details
    const bom = await Promise.all(product.materialsRequired.map(async (item) => {
      const material = await RawMaterial.findById(item.materialId);
      return {
        materialId: item.materialId,
        materialName: material ? material.name : 'Unknown',
        itemCode: material ? material.itemCode : 'Unknown',
        quantityPerPiece: item.quantityPerPiece,
        unit: material ? material.unit : 'Unknown'
      };
    }));
    
    res.status(200).json({
      product: {
        id: product._id,
        styleNo: product.styleNo,
        itemName: product.itemName
      },
      bom
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { itemName, description, materialsRequired } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Validate materials if provided
    if (materialsRequired && materialsRequired.length > 0) {
      for (const material of materialsRequired) {
        const materialExists = await RawMaterial.findById(material.materialId);
        if (!materialExists) {
          return res.status(400).json({ 
            message: `Material with ID ${material.materialId} does not exist`
          });
        }
        
        if (!material.quantityPerPiece || material.quantityPerPiece <= 0) {
          return res.status(400).json({ 
            message: 'Quantity per piece must be a positive number'
          });
        }
      }
      
      product.materialsRequired = materialsRequired;
    }
    
    if (itemName) product.itemName = itemName;
    if (description !== undefined) product.description = description;
    
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if product is being used in any orders
    const ordersUsingProduct = await Order.find({ productId });
    
    if (ordersUsingProduct.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product as it is being used in orders',
        orders: ordersUsingProduct.map(o => ({ id: o._id, poNo: o.poNo }))
      });
    }
    
    // Delete the product if not in use
    await Product.findByIdAndDelete(productId);
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product wastage settings
exports.getProductWastage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id).populate('materialsRequired.materialId', 'name itemCode unit');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Format the wastage data for easier consumption by frontend
    const wastageData = product.materialsRequired.map(material => ({
      materialId: material.materialId._id,
      materialName: material.materialId.name,
      itemCode: material.materialId.itemCode,
      unit: material.materialId.unit,
      quantityPerPiece: material.quantityPerPiece,
      expectedWastagePercentage: material.expectedWastagePercentage || 0,
      remarks: material.wastageRemarks || ''
    }));
    
    res.json({
      productId: product._id,
      styleNo: product.styleNo,
      itemName: product.itemName,
      materialsWastage: wastageData,
      remarks: product.wastageRemarks || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProductWastage = async (req, res) => {
  try {
    const { id } = req.params;
    // Fix: Accept both materialWastage and materialsWastage
    const materialWastage = req.body.materialWastage || req.body.materialsWastage;
    const { remarks } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Make sure materialWastage exists
    if (!materialWastage || !Array.isArray(materialWastage)) {
      return res.status(400).json({ 
        message: 'materialWastage or materialsWastage array is required'
      });
    }
    
    // Update overall wastage remarks if provided
    if (remarks !== undefined) {
      product.wastageRemarks = remarks;
    }
    
    // Update each material's expected wastage percentage and remarks
    materialWastage.forEach(material => {
      const materialId = material.materialId._id || material.materialId;
      
      const materialIndex = product.materialsRequired.findIndex(
        m => m.materialId.toString() === materialId.toString()
      );
      
      if (materialIndex !== -1) {
        // Update wastage percentage
        product.materialsRequired[materialIndex].expectedWastagePercentage = 
          Number(material.expectedWastagePercentage) || 0;
        
        // Update wastage remarks if provided
        if (material.remarks !== undefined) {
          product.materialsRequired[materialIndex].wastageRemarks = material.remarks;
        }
      }
    });
    
    // Save the product with updated wastage data
    await product.save();
    
    // Update any existing orders that use this product to recalculate standard wastage
    const orders = await Order.find({ 
      'productId': id,
      'status': { $in: ['PENDING', 'PRODUCING'] }  
    });
    
    // Recalculate standard wastage for each order
    for (const order of orders) {
      await updateOrderStandardWastage(order._id);
    }
    
    // Return the updated product
    res.json({ 
      message: 'Product wastage updated successfully',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to update order's standard wastage based on product wastage settings
const updateOrderStandardWastage = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('productId');
    if (!order) {
      throw new Error('Order not found');
    }
    
    const product = order.productId;
    if (!product) {
      throw new Error('Product not found for order');
    }
    
    // Get the consumption report
    let consumptionReport = order.consumptionReport || [];
    
    // Update standard wastage for each material based on product settings
    product.materialsRequired.forEach(material => {
      const materialId = material.materialId.toString();
      const expectedWastagePercentage = material.expectedWastagePercentage || 0;
      
      // Find the material in the consumption report
      const materialIndex = consumptionReport.findIndex(
        m => m.materialId.toString() === materialId
      );
      
      if (materialIndex !== -1) {
        const requiredQty = material.quantityPerPiece * order.quantity;
        const standardWastage = (requiredQty * expectedWastagePercentage) / 100;
        
        // Update standard wastage
        consumptionReport[materialIndex].standardWastage = standardWastage;
        consumptionReport[materialIndex].wastage = 
          standardWastage + (consumptionReport[materialIndex].extraWastage || 0);
        
        // Recalculate wastage percentage
        const actualUsedQty = consumptionReport[materialIndex].actualUsedQty || requiredQty;
        if (actualUsedQty > 0) {
          consumptionReport[materialIndex].wastePercentage = 
            ((consumptionReport[materialIndex].wastage / actualUsedQty) * 100).toFixed(2);
        }
      }
    });
    
    // Save the updated order
    await Order.findByIdAndUpdate(orderId, { consumptionReport });
  } catch (error) {
    console.error('Error updating order standard wastage:', error);
  }
};