const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { checkLicense } = require('../middleware/licenseMiddleware');

router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(checkLicense, createPayment);

module.exports = router;
