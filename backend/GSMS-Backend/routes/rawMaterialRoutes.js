const express = require('express');
const router = express.Router();
const rawMaterialController = require('../controllers/rawMaterialController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Get all materials
router.get('/', rawMaterialController.getAllMaterials);

// Get material by ID
router.get('/:id', rawMaterialController.getMaterialById);

// Create new material (Admin and Manager only)
router.post(
  '/',
  checkRole(['ADMIN', 'MANAGER']),
  rawMaterialController.createMaterial
);

// Add stock batch (Admin and Manager only)
router.post(
  '/:id/receive',
  checkRole(['ADMIN', 'MANAGER']),
  rawMaterialController.addStockBatch
);

// Update material (Admin and Manager only)
router.put(
  '/:id',
  checkRole(['ADMIN', 'MANAGER']),
  rawMaterialController.updateMaterial
);

// Delete material (Admin and Manager only)
router.delete(
  '/:id',
  checkRole(['ADMIN', 'MANAGER']),
  rawMaterialController.deleteMaterial
);

module.exports = router; 