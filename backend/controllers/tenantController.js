const Tenant = require('../models/Tenant');
const User = require('../models/User');
const crypto = require('crypto');

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
        return { ...tenant._doc, adminCount: users.length, users };
      })
    );

    res.status(200).json({ success: true, count: tenants.length, tenants: tenantsWithUsers });
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

// @desc    Create tenant and its admin user
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
      adminPassword 
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

    // Determine expiry based on plan
    const currentDate = new Date();
    let validTill = new Date();
    if (plan === 'premium') {
      validTill.setFullYear(currentDate.getFullYear() + 1);
    } else {
      validTill.setMonth(currentDate.getMonth() + 1);
    }

    // Create Tenant
    const tenant = await Tenant.create({
      businessName,
      contactEmail,
      contactPhone,
      plan,
      validTill,
      status: 'active',
    });

    // Create Admin User for this Tenant
    const adminUser = await User.create({
      tenantId: tenant._id,
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    res.status(201).json({ 
      success: true, 
      tenant,
      adminUser: {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    next(error);
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
