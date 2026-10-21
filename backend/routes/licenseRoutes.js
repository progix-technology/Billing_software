const express = require('express');
const router = express.Router();
const {
  getLicenseStatus,
  activateLicenseKey,
  generateLicenseKey,
} = require('../services/licenseService');

// @route   GET /api/license/status
// @desc    Get current offline license status & Machine ID
router.get('/status', async (req, res) => {
  try {
    const status = await getLicenseStatus();
    res.status(200).json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/license/activate
// @desc    Activate license using offline activation key
router.post('/activate', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'Please provide a license key.' });
    }

    const result = await activateLicenseKey(licenseKey);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/license/generate
// @desc    SuperAdmin utility to generate license keys for clients
router.post('/generate', async (req, res) => {
  try {
    const { machineId, planName, durationDays } = req.body;
    if (!machineId) {
      return res.status(400).json({ success: false, message: 'Machine ID is required.' });
    }

    const key = generateLicenseKey(machineId, planName || 'Gold', durationDays || 365);
    res.status(200).json({
      success: true,
      licenseKey: key,
      machineId,
      planName: planName || 'Gold',
      durationDays: durationDays || 365,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
