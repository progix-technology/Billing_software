const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema(
  {
    // A singleton document identifier
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'System is under maintenance. Please try again later.',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
