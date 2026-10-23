const express = require('express');
const router = express.Router();
const {
  generateQuickKey,
  getLicenses,
  revokeLicense,
  verifyLicensePublic
} = require('../controllers/licenseController');
const { protect } = require('../middleware/authMiddleware');
const { verifyLimiter } = require('../middleware/rateLimiter');

// Public verification endpoint called by desktop apps (Rate-limited to 30/min per IP)
router.post('/verify', verifyLimiter, verifyLicensePublic);

// Protected SuperAdmin routes
router.post('/generate', protect, generateQuickKey);
router.get('/', protect, getLicenses);
router.put('/:id/revoke', protect, revokeLicense);

module.exports = router;
