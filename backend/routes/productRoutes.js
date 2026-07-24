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

router.use(protect);

router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/inventory/logs', getAllInventoryLogs);
router.get('/:id/logs', getProductLogs);
router.post('/:id/stock-in', authorize('admin', 'manager'), stockIn);

router
  .route('/')
  .get(getProducts)
  .post(authorize('admin', 'manager'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(authorize('admin', 'manager'), updateProduct)
  .delete(authorize('admin', 'manager'), deleteProduct);

module.exports = router;
