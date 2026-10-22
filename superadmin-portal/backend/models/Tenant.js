const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  address: { type: String, default: '' },
  machineId: { type: String, default: '' },
  licenseKey: { type: String, default: '' },
  plan: { type: String, default: 'Gold' },
  validTill: { type: Date, required: true },
  status: { type: String, enum: ['active', 'suspended', 'expired'], default: 'active' },
  adminUsername: { type: String, default: '' },
  adminEmail: { type: String, default: '' },
  notes: { type: String, default: '' },
  activatedAt: { type: Date, default: null },
  lastHeartbeat: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tenant', tenantSchema);
