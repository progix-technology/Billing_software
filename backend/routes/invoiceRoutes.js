const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  getInvoicePDF,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id/pdf', getInvoicePDF);

router
  .route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id').get(getInvoice);

module.exports = router;
