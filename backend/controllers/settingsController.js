const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const InventoryLog = require('../models/InventoryLog');
const ActivityLog = require('../models/ActivityLog');
const StoreSetting = require('../models/StoreSetting');


// @desc    Export database dump as JSON
// @route   GET /api/settings/backup
// @access  Private (Admin only)
exports.backupDatabase = async (req, res, next) => {
  try {
    const categories = await Category.find();
    const products = await Product.find();
    const customers = await Customer.find();
    const suppliers = await Supplier.find();
    const invoices = await Invoice.find();
    const payments = await Payment.find();
    const inventoryLogs = await InventoryLog.find();
    const users = await User.find().select('+password');

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        categories,
        products,
        customers,
        suppliers,
        invoices,
        payments,
        inventoryLogs,
        users,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=backup-data.json');
    res.status(200).json(backupData);
  } catch (error) {
    next(error);
  }
};

// @desc    Restore database from JSON dump
// @route   POST /api/settings/restore
// @access  Private (Admin only)
exports.restoreDatabase = async (req, res, next) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, message: 'Invalid backup file payload' });
    }

    // Clear existing
    if (data.categories) {
      await Category.deleteMany({});
      await Category.insertMany(data.categories);
    }
    if (data.products) {
      await Product.deleteMany({});
      await Product.insertMany(data.products);
    }
    if (data.customers) {
      await Customer.deleteMany({});
      await Customer.insertMany(data.customers);
    }
    if (data.suppliers) {
      await Supplier.deleteMany({});
      await Supplier.insertMany(data.suppliers);
    }
    if (data.invoices) {
      await Invoice.deleteMany({});
      await Invoice.insertMany(data.invoices);
    }
    if (data.payments) {
      await Payment.deleteMany({});
      await Payment.insertMany(data.payments);
    }
    if (data.inventoryLogs) {
      await InventoryLog.deleteMany({});
      await InventoryLog.insertMany(data.inventoryLogs);
    }
    if (data.users) {
      await User.deleteMany({});
      await User.insertMany(data.users);
    }

    // Log this operation
    await ActivityLog.create({
      user: req.user.id,
      action: 'DATABASE_RESTORE',
      module: 'SETTINGS',
      details: 'Full database restore executed from backup file',
    });

    res.status(200).json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get store settings
// @route   GET /api/settings
// @access  Private
exports.getStoreSettings = async (req, res, next) => {
  try {
    let settings = await StoreSetting.findOne();
    if (!settings) {
      // Create default settings if not exists
      settings = await StoreSetting.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Update store settings
// @route   POST /api/settings
// @access  Private (Admin only)
exports.saveStoreSettings = async (req, res, next) => {
  try {
    const { storeName, storeGst, storeAddress, storePhone, dashboardBanner, gstSlabs } = req.body;

    let settings = await StoreSetting.findOne();
    if (!settings) {
      settings = new StoreSetting({});
    }

    if (storeName !== undefined) settings.storeName = storeName;
    if (storeGst !== undefined) settings.storeGst = storeGst;
    if (storeAddress !== undefined) settings.storeAddress = storeAddress;
    if (storePhone !== undefined) settings.storePhone = storePhone;
    if (dashboardBanner !== undefined) settings.dashboardBanner = dashboardBanner;
    if (gstSlabs !== undefined) settings.gstSlabs = gstSlabs;

    await settings.save();

    // Log this operation
    await ActivityLog.create({
      user: req.user.id,
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      details: 'Store settings updated by Admin',
    });

    res.status(200).json({ success: true, settings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

