const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'System is temporarily under scheduled maintenance.' },
  globalAnnouncement: { type: String, default: '' },
  remoteLockVersion: { type: String, default: '' },
  supportPhone: { type: String, default: '+91 89532 08952' },
  supportEmail: { type: String, default: 'info@progixtechnology.com' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
