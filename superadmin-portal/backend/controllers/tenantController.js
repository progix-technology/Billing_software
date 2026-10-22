const Tenant = require('../models/Tenant');
const License = require('../models/License');
const { generateLicenseKey } = require('../services/licenseService');

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private (SuperAdmin)
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tenants.length, tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new tenant and auto-generate license key
// @route   POST /api/tenants
// @access  Private (SuperAdmin)
exports.createTenant = async (req, res) => {
  try {
    const {
      businessName,
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      plan,
      machineId,
      durationDays,
      notes
    } = req.body;

    if (!businessName) {
      return res.status(400).json({ success: false, message: 'Business / Store Name is required' });
    }

    const days = parseInt(durationDays || 365, 10);
    const chosenPlan = plan || 'Gold';
    const cleanMachineId = machineId ? machineId.trim().toUpperCase() : 'ANYPC000';

    // Generate cryptographic license key
    const gen = generateLicenseKey(cleanMachineId, chosenPlan, days);

    // Save Tenant
    const tenant = await Tenant.create({
      businessName,
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      address: address || '',
      machineId: cleanMachineId,
      licenseKey: gen.licenseKey,
      plan: chosenPlan,
      validTill: gen.expiryDate,
      status: 'active',
      notes: notes || ''
    });

    // Save License Record
    await License.create({
      licenseKey: gen.licenseKey,
      machineId: cleanMachineId,
      planName: chosenPlan,
      durationDays: days,
      issuedTo: businessName,
      phone: contactPhone || '',
      expiryDate: gen.expiryDate,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      tenant,
      licenseKey: gen.licenseKey,
      validTill: gen.expiryDate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    1-Click Extend or Renew Tenant License
// @route   POST /api/tenants/:id/renew
// @access  Private (SuperAdmin)
exports.renewTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationDays, plan, machineId } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const days = parseInt(durationDays || 365, 10);
    const targetMachine = (machineId || tenant.machineId || 'ANYPC000').trim().toUpperCase();
    const targetPlan = plan || tenant.plan || 'Gold';

    const gen = generateLicenseKey(targetMachine, targetPlan, days);

    tenant.licenseKey = gen.licenseKey;
    tenant.validTill = gen.expiryDate;
    tenant.status = 'active';
    tenant.machineId = targetMachine;
    if (plan) tenant.plan = plan;
    tenant.updatedAt = new Date();
    await tenant.save();

    // Create or update license
    await License.create({
      licenseKey: gen.licenseKey,
      machineId: targetMachine,
      planName: targetPlan,
      durationDays: days,
      issuedTo: tenant.businessName,
      phone: tenant.contactPhone,
      expiryDate: gen.expiryDate,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      message: 'License renewed successfully',
      tenant,
      licenseKey: gen.licenseKey,
      validTill: gen.expiryDate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Tenant Status (Suspend / Reactivate)
// @route   PUT /api/tenants/:id/status
// @access  Private (SuperAdmin)
exports.toggleTenantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.status = status || (tenant.status === 'active' ? 'suspended' : 'active');
    tenant.updatedAt = new Date();
    await tenant.save();

    // Also update license status
    if (tenant.licenseKey) {
      await License.updateOne(
        { licenseKey: tenant.licenseKey },
        { status: tenant.status === 'suspended' ? 'revoked' : 'active' }
      );
    }

    res.status(200).json({
      success: true,
      message: `Tenant status changed to ${tenant.status}`,
      tenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Tenant Details
// @route   PUT /api/tenants/:id
// @access  Private (SuperAdmin)
exports.updateTenant = async (req, res) => {
  try {
    req.body.updatedAt = new Date();
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    res.status(200).json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Tenant
// @route   DELETE /api/tenants/:id
// @access  Private (SuperAdmin)
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
