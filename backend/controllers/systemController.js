const SystemSetting = require('../models/SystemSetting');

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
