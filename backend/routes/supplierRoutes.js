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
const { checkLicense } = require('../middleware/licenseMiddleware');

router.use(protect);

router.get('/:id/ledger', getSupplierLedger);

router
  .route('/')
  .get(getSuppliers)
  .post(authorize('admin', 'manager'), checkLicense, createSupplier);

router
  .route('/:id')
  .get(getSupplier)
  .put(authorize('admin', 'manager'), checkLicense, updateSupplier)
  .delete(authorize('admin', 'manager'), checkLicense, deleteSupplier);

module.exports = router;
