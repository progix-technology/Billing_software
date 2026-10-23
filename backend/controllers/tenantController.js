const Tenant = require('../models/Tenant');
const User = require('../models/User');
const crypto = require('crypto');
const { generateLicenseKey, generateSmartLicenseKey } = require('../services/licenseService');
const ClientAdmin = require('../superadmin/models/ClientAdmin');
const LicenseKey = require('../superadmin/models/LicenseKey');

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private (Superadmin)
exports.getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });
    
    // For each tenant, fetch their admin list
    const tenantsWithUsers = await Promise.all(
      tenants.map(async (tenant) => {
        const users = await User.find({ tenantId: tenant._id, role: 'admin' }).select('-password');
        const baseDoc = tenant._doc || tenant;
        return { ...baseDoc, adminCount: users.length, users };
      })
    );

    // Also fetch MongoDB Atlas clients to merge
    try {
      const atlasClients = await ClientAdmin.find().sort({ createdAt: -1 });
      const atlasMapped = atlasClients.map(c => ({
        _id: c._id.toString(),
        businessName: c.storeName,
        contactEmail: c.email,
        contactPhone: c.phone,
        plan: c.planName,
        status: c.status,
        machineId: c.machineId,
        licenseKey: c.licenseKey,
        validTill: c.validTill,
        createdAt: c.createdAt,
        adminCount: 1,
        users: [{ username: c.ownerName || 'Admin', email: c.email, role: 'admin' }]
      }));

      // Combine without duplicating businessName / email
      const existingEmails = new Set(tenantsWithUsers.map(t => (t.contactEmail || '').toLowerCase()));
      for (const ac of atlasMapped) {
        if (!existingEmails.has((ac.contactEmail || '').toLowerCase())) {
          tenantsWithUsers.push(ac);
        }
      }
    } catch (atlasErr) {
      console.warn('[TenantController] Atlas merge note:', atlasErr.message);
    }

    res.status(200).json({ success: true, count: tenantsWithUsers.length, tenants: tenantsWithUsers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tenant
// @route   GET /api/tenants/:id
// @access  Private (Superadmin)
exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    
    const users = await User.find({ tenantId: tenant._id }).select('-password');

    res.status(200).json({ success: true, tenant, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tenant and its admin user with optional license key
// @route   POST /api/tenants
// @access  Private (Superadmin)
exports.createTenant = async (req, res, next) => {
  try {
    const { 
      businessName, 
      contactEmail, 
      contactPhone, 
      plan, 
      adminUsername, 
      adminEmail, 
      adminPassword,
      machineId,
      durationDays
    } = req.body;

    // Validate inputs
    if (!businessName || !adminUsername || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if admin email already exists globally
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An admin with that email already exists' });
    }

    // Determine validity days & expiry
    const days = parseInt(durationDays || (plan === 'premium' ? 365 : 30), 10);
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + days);

    // Always generate Smart Self-Configuring Activation Key encoding credentials & duration
    const licenseKey = generateSmartLicenseKey({
      adminUsername,
      adminEmail,
      adminPassword,
      storeName: businessName,
      planName: plan || 'Gold',
      durationDays: days,
      machineId: machineId ? machineId.trim().toUpperCase() : 'ANYPC000',
    });

    // Create Tenant
    const tenant = await Tenant.create({
      businessName,
      contactEmail,
      contactPhone,
      plan: plan || 'basic',
      validTill,
      status: 'active',
      machineId: machineId ? machineId.trim().toUpperCase() : '',
      licenseKey: licenseKey || '',
    });

    // Create Admin User for this Tenant
    const adminUser = await User.create({
      tenantId: tenant._id,
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    // Also persist directly into MongoDB Atlas cloud database
    try {
      await ClientAdmin.create({
        storeName: businessName,
        ownerName: adminUsername,
        phone: contactPhone || '',
        email: adminEmail,
        machineId: machineId ? machineId.trim().toUpperCase() : 'ANYPC000',
        planName: plan || 'Gold',
        durationDays: days,
        licenseKey: licenseKey || '',
        validTill,
        status: 'active'
      });

      if (licenseKey) {
        await LicenseKey.create({
          licenseKey,
          machineId: machineId ? machineId.trim().toUpperCase() : 'ANYPC000',
          planName: plan || 'Gold',
          durationDays: days,
          issuedTo: businessName,
          expiryDate: validTill,
          status: 'active'
        });
      }
    } catch (atlasErr) {
      console.warn('[TenantController] Atlas save note:', atlasErr.message);
    }

    res.status(201).json({ 
      success: true, 
      tenant,
      adminUser: {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        plainPassword: adminPassword // to show in instant copyable card
      },
      licenseKey: licenseKey || null,
      validTill
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate or renew license key for a tenant
// @route   POST /api/tenants/:id/license
// @access  Private (Superadmin)
exports.generateTenantLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { machineId, plan, durationDays } = req.body;

    if (!machineId) {
      return res.status(400).json({ success: false, message: 'Client Machine Hardware ID is required' });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const days = parseInt(durationDays || 365, 10);
    const key = generateLicenseKey(machineId.trim().toUpperCase(), plan || tenant.plan || 'Gold', days);

    const validTill = new Date();
    validTill.setDate(validTill.getDate() + days);

    tenant.machineId = machineId.trim().toUpperCase();
    tenant.licenseKey = key;
    tenant.validTill = validTill;
    if (plan) tenant.plan = plan;
    await tenant.save();

    // Also persist into MongoDB Atlas
    try {
      await LicenseKey.create({
        licenseKey: key,
        machineId: machineId.trim().toUpperCase(),
        planName: plan || tenant.plan || 'Gold',
        durationDays: days,
        issuedTo: tenant.businessName || 'Tenant Renewal',
        expiryDate: validTill,
        status: 'active'
      });
      await ClientAdmin.findOneAndUpdate(
        { email: tenant.contactEmail },
        { licenseKey: key, validTill, machineId: machineId.trim().toUpperCase(), planName: plan || tenant.plan || 'Gold' }
      );
    } catch (atlasErr) {
      console.warn('[TenantController] Atlas license update note:', atlasErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'License key successfully generated for tenant!',
      licenseKey: key,
      validTill,
      tenant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Private (Superadmin)
exports.updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    res.status(200).json({ success: true, tenant });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tenant (soft delete or deactivate)
// @route   DELETE /api/tenants/:id
// @access  Private (Superadmin)
exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // We can deactivate instead of full delete
    tenant.status = 'inactive';
    await tenant.save();

    res.status(200).json({ success: true, message: 'Tenant deactivated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Admin Password
// @route   PUT /api/tenants/:id/users/:userId/password
// @access  Private (Superadmin)
exports.resetAdminPassword = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const user = await User.findOne({ _id: userId, tenantId: id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin user not found in this tenant' });
    }

    user.password = password;
    await user.save(); // pre-save hook in User model will hash it

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
