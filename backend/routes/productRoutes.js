const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  stockIn,
  getLowStockAlerts,
  getProductLogs,
  getAllInventoryLogs,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkLicense } = require('../middleware/licenseMiddleware');

router.use(protect);

router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/inventory/logs', getAllInventoryLogs);
router.get('/:id/logs', getProductLogs);
router.post('/:id/stock-in', authorize('admin', 'manager'), checkLicense, stockIn);

router
  .route('/')
  .get(getProducts)
  .post(authorize('admin', 'manager'), checkLicense, createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(authorize('admin', 'manager'), checkLicense, updateProduct)
  .delete(authorize('admin', 'manager'), checkLicense, deleteProduct);

module.exports = router;
