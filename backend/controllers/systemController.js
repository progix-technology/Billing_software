const SystemSetting = require('../models/SystemSetting');
const StoreSetting = require('../models/StoreSetting');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const InventoryLog = require('../models/InventoryLog');
const { getLicenseStatus } = require('../services/licenseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Get system settings (public/all users to check maintenance mode)
// @route   GET /api/system/settings
// @access  Public
exports.getSystemSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'global' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'global' });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings (maintenance mode)
// @route   PUT /api/system/settings
// @access  Private (Superadmin)
exports.updateSystemSettings = async (req, res, next) => {
  try {
    const { isMaintenanceMode, maintenanceMessage } = req.body;

    let settings = await SystemSetting.findOne({ key: 'global' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'global' });
    }

    if (isMaintenanceMode !== undefined) {
      settings.isMaintenanceMode = isMaintenanceMode;
    }
    if (maintenanceMessage !== undefined) {
      settings.maintenanceMessage = maintenanceMessage;
    }

    await settings.save();

    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activation and initial setup status
// @route   GET /api/system/setup-status
// @access  Public
exports.getSetupStatus = async (req, res, next) => {
  try {
    const licenseStatus = await getLicenseStatus();
    const store = await StoreSetting.findOne({});
    const adminUser = await User.findOne({ role: 'admin' });

    // Check if store has been manually setup on this computer
    const isSetupCompleted = Boolean(store && store.setupCompleted);

    res.status(200).json({
      success: true,
      license: licenseStatus,
      isActivated: Boolean(licenseStatus.isActivated && !licenseStatus.isExpired),
      isExpired: Boolean(licenseStatus.isExpired),
      isSetupCompleted,
      storeName: store?.storeName || 'PRO Billing Software',
      adminEmail: adminUser?.email || ''
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform manual store profile & admin credentials setup on client PC
// @route   POST /api/system/initial-setup
// @access  Public (Only if licensed)
exports.initialSetup = async (req, res, next) => {
  try {
    const {
      storeName,
      ownerName,
      phone,
      address,
      gstNumber,
      adminEmail,
      adminPassword,
      cleanSampleData
    } = req.body;

    if (!storeName || !adminEmail || !adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Store Name, Admin Email, and Admin Password are required.' 
      });
    }

    // 1. Wipe sample inventory/records if user wants fresh start
    if (cleanSampleData) {
      await Product.deleteMany({});
      await Customer.deleteMany({});
      await Supplier.deleteMany({});
      await Invoice.deleteMany({});
      await Payment.deleteMany({});
      await InventoryLog.deleteMany({});
    }

    // 2. Update or create StoreSetting
    let store = await StoreSetting.findOne({});
    if (!store) {
      store = new StoreSetting({});
    }
    store.storeName = storeName.trim();
    store.storePhone = (phone || '').trim();
    store.storeAddress = (address || '').trim();
    store.storeGst = (gstNumber || '').trim();
    store.setupCompleted = true;
    await store.save();

    // 3. Update or create primary Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword.trim(), salt);

    let adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      adminUser.username = (ownerName || storeName).trim();
      adminUser.email = adminEmail.trim().toLowerCase();
      adminUser.password = hashedPassword;
      adminUser.status = 'active';
      await adminUser.save();
    } else {
      adminUser = await User.create({
        username: (ownerName || storeName).trim(),
        email: adminEmail.trim().toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role, tenantId: adminUser.tenantId },
      process.env.JWT_SECRET || 'fallback_secret_offline_mode',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Store and Admin memory setup successfully saved!',
      token,
      user: {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      },
      store: {
        storeName: store.storeName,
        storePhone: store.storePhone,
        storeAddress: store.storeAddress,
        storeGst: store.storeGst
      }
    });
  } catch (error) {
    next(error);
  }
};
