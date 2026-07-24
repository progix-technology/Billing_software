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

router.use(protect);

router.get('/:id/ledger', getCustomerLedger);

router
  .route('/')
  .get(getCustomers)
  .post(createCustomer);

router
  .route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(authorize('admin'), deleteCustomer);

module.exports = router;
