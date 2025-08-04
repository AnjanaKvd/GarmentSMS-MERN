const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const customerController = require('../controllers/customerController');

// All routes require authentication
router.use(verifyToken);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);

router.post('/', checkRole(['ADMIN', 'MANAGER']), customerController.createCustomer);
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), customerController.updateCustomer);
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), customerController.deleteCustomer);

module.exports = router;
