const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  licenseKey: { type: String, required: true, unique: true },
  machineId: { type: String, required: true },
  planName: { type: String, default: 'Gold' },
  durationDays: { type: Number, default: 365 },
  issuedTo: { type: String, default: '' },
  phone: { type: String, default: '' },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
  firstActivatedAt: { type: Date, default: null },
  lastVerifiedAt: { type: Date, default: null },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('License', licenseSchema);
