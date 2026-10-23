const express = require('express');
const router = express.Router();
const {
  getLicenseStatus,
  activateLicenseKey,
  generateLicenseKey,
  generateSmartLicenseKey,
} = require('../services/licenseService');
const LicenseKey = require('../superadmin/models/LicenseKey');

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
    const { 
      machineId, 
      planName, 
      durationDays, 
      issuedTo, 
      phone,
      adminUsername,
      adminEmail,
      adminPassword,
      storeName
    } = req.body;

    if (!machineId) {
      return res.status(400).json({ success: false, message: 'Machine ID is required.' });
    }

    const days = parseInt(durationDays || 365, 10);
    const key = generateSmartLicenseKey({
      adminUsername: adminUsername || issuedTo || 'Admin',
      adminEmail: adminEmail || 'admin@store.com',
      adminPassword: adminPassword || 'Admin@123',
      storeName: storeName || issuedTo || 'PRO Store',
      planName: planName || 'Gold',
      durationDays: days,
      machineId: machineId.trim().toUpperCase()
    });

    // Save directly to MongoDB Atlas cloud database
    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      await LicenseKey.create({
        licenseKey: key,
        machineId: machineId.trim().toUpperCase(),
        planName: planName || 'Gold',
        durationDays: days,
        issuedTo: issuedTo || storeName || 'Client Store',
        phone: phone || '',
        expiryDate: expDate,
        status: 'active'
      });
    } catch (cloudErr) {
      console.warn('[MongoDB Atlas] Could not log key to cloud:', cloudErr.message);
    }

    res.status(200).json({
      success: true,
      licenseKey: key,
      machineId,
      planName: planName || 'Gold',
      durationDays: days,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
