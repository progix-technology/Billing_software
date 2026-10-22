const Tenant = require('../models/Tenant');
const License = require('../models/License');
const Package = require('../models/Package');
const SystemSetting = require('../models/SystemSetting');

exports.getStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.countDocuments();
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const suspendedTenants = await Tenant.countDocuments({ status: 'suspended' });

    const totalLicenses = await License.countDocuments();
    const activeLicenses = await License.countDocuments({ status: 'active' });

    // Expiring in next 7 days
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const expiringSoon = await Tenant.find({
      status: 'active',
      validTill: { $gte: now, $lte: sevenDaysLater }
    }).sort({ validTill: 1 });

    // Recent Onboarded Tenants
    const recentTenants = await Tenant.find().sort({ createdAt: -1 }).limit(10);

    // Recent Licenses
    const recentLicenses = await License.find().sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalLicenses,
        activeLicenses,
        expiringSoonCount: expiringSoon.length
      },
      expiringSoon,
      recentTenants,
      recentLicenses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create(req.body);
    } else {
      settings = await SystemSetting.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
