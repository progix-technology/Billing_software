const express = require('express');
const router = express.Router();
const {
  getGstReport,
  getProfitLossReport,
  exportSalesExcel,
  exportStockExcel,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/gst', getGstReport);
router.get('/profit-loss', authorize('admin', 'manager'), getProfitLossReport);
router.get('/sales/excel', authorize('admin', 'manager'), exportSalesExcel);
router.get('/stock/excel', authorize('admin', 'manager'), exportStockExcel);

module.exports = router;
