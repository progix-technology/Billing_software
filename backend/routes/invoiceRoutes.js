const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { checkLicense } = require('../middleware/licenseMiddleware');

router.use(protect);

router
  .route('/')
  .get(getInvoices)
  .post(checkLicense, createInvoice);

router.route('/:id').get(getInvoice);

module.exports = router;
