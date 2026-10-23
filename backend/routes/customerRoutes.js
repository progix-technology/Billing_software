const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkLicense } = require('../middleware/licenseMiddleware');

router.use(protect);

router.get('/:id/ledger', getCustomerLedger);

router
  .route('/')
  .get(getCustomers)
  .post(checkLicense, createCustomer);

router
  .route('/:id')
  .get(getCustomer)
  .put(checkLicense, updateCustomer)
  .delete(authorize('admin'), checkLicense, deleteCustomer);

module.exports = router;
