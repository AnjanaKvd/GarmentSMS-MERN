const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get BOM for a product
router.get('/:id/bom', productController.getProductBOM);

// Get product wastage settings
router.get('/:id/wastage', productController.getProductWastage);

// Create new product (Admin and Manager only)
router.post(
  '/',
  checkRole(['ADMIN', 'MANAGER']),
  productController.createProduct
);

// Update product (Admin and Manager only)
router.put(
  '/:id',
  checkRole(['ADMIN', 'MANAGER']),
  productController.updateProduct
);

// Update product wastage percentages
router.patch(
  '/:id/wastage',
  checkRole(['ADMIN', 'MANAGER', 'PRODUCTION']),
  productController.updateProductWastage
);

// Delete product (Admin and Manager only)
router.delete(
  '/:id',
  checkRole(['ADMIN', 'MANAGER']),
  productController.deleteProduct
);

module.exports = router;