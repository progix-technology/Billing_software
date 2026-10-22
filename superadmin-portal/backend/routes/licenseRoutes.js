const express = require('express');
const router = express.Router();
const {
  generateQuickKey,
  getLicenses,
  revokeLicense,
  verifyLicensePublic
} = require('../controllers/licenseController');
const { protect } = require('../middleware/authMiddleware');

// Public verification endpoint called by desktop apps
router.post('/verify', verifyLicensePublic);

// Protected SuperAdmin routes
router.post('/generate', protect, generateQuickKey);
router.get('/', protect, getLicenses);
router.put('/:id/revoke', protect, revokeLicense);

module.exports = router;
