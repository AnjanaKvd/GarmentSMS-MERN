const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const Order = require('../models/Order');

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