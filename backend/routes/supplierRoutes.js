const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierLedger,
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id/ledger', getSupplierLedger);

router
  .route('/')
  .get(getSuppliers)
  .post(authorize('admin', 'manager'), createSupplier);

router
  .route('/:id')
  .get(getSupplier)
  .put(authorize('admin', 'manager'), updateSupplier)
  .delete(authorize('admin', 'manager'), deleteSupplier);

module.exports = router;
