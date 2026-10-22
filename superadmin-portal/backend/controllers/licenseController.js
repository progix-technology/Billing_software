const License = require('../models/License');
const Tenant = require('../models/Tenant');
const { generateLicenseKey, verifyLicenseKey } = require('../services/licenseService');

// @desc    Quick Standalone License Key Generator
// @route   POST /api/licenses/generate
// @access  Private (SuperAdmin)
exports.generateQuickKey = async (req, res) => {
  try {
    const { machineId, planName, durationDays, issuedTo, phone, notes } = req.body;

    const days = parseInt(durationDays || 365, 10);
    const plan = planName || 'Gold';
    const machine = (machineId || 'ANYPC000').trim().toUpperCase();

    const gen = generateLicenseKey(machine, plan, days);

    const record = await License.create({
      licenseKey: gen.licenseKey,
      machineId: machine,
      planName: plan,
      durationDays: days,
      issuedTo: issuedTo || 'Direct Sale',
      phone: phone || '',
      expiryDate: gen.expiryDate,
      notes: notes || '',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      licenseKey: gen.licenseKey,
      validTill: gen.expiryDate,
      planName: plan,
      machineId: machine,
      record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Licenses
// @route   GET /api/licenses
// @access  Private (SuperAdmin)
exports.getLicenses = async (req, res) => {
  try {
    const licenses = await License.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: licenses.length, licenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Revoke License
// @route   PUT /api/licenses/:id/revoke
// @access  Private (SuperAdmin)
exports.revokeLicense = async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }
    license.status = license.status === 'revoked' ? 'active' : 'revoked';
    await license.save();

    // If linked to tenant, update tenant as well
    await Tenant.updateMany(
      { licenseKey: license.licenseKey },
      { status: license.status === 'revoked' ? 'suspended' : 'active' }
    );

    res.status(200).json({ success: true, message: `License status changed to ${license.status}`, license });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    PUBLIC Online License Verification API (Called by Desktop Apps)
// @route   POST /api/license/verify
// @access  Public
exports.verifyLicensePublic = async (req, res) => {
  try {
    const { licenseKey, machineId, storeName } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ valid: false, message: 'License Key is required' });
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const cleanMachine = (machineId || '').trim().toUpperCase();

    // 1. Cryptographic Signature Validation
    const cryptoCheck = verifyLicenseKey(cleanKey, cleanMachine);
    if (!cryptoCheck.valid) {
      return res.status(400).json({ valid: false, message: cryptoCheck.message });
    }

    // 2. Cloud DB Lookup (Check if blocked or suspended by SuperAdmin)
    const dbLicense = await License.findOne({ licenseKey: cleanKey });
    if (dbLicense) {
      if (dbLicense.status === 'revoked') {
        return res.status(403).json({
          valid: false,
          message: 'This software license has been suspended by the administrator. Contact support.'
        });
      }

      // Update heartbeat & first activation
      if (!dbLicense.firstActivatedAt) {
        dbLicense.firstActivatedAt = new Date();
      }
      dbLicense.lastVerifiedAt = new Date();
      if (storeName && !dbLicense.issuedTo) {
        dbLicense.issuedTo = storeName;
      }
      await dbLicense.save();
    }

    // Also update tenant if exists
    const tenant = await Tenant.findOne({ licenseKey: cleanKey });
    if (tenant) {
      if (tenant.status === 'suspended') {
        return res.status(403).json({
          valid: false,
          message: 'Your store account is suspended. Please contact PRO Billing Software support.'
        });
      }
      tenant.lastHeartbeat = new Date();
      if (!tenant.activatedAt) tenant.activatedAt = new Date();
      await tenant.save();
    }

    res.status(200).json({
      valid: true,
      message: 'License verified successfully.',
      planName: dbLicense ? dbLicense.planName : cryptoCheck.planCode,
      expiryDate: cryptoCheck.expiryDate,
      isLifetime: cryptoCheck.isLifetime,
      serverTime: new Date()
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
};
