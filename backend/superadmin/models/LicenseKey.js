let Schema;
try {
  const mongoose = require('mongoose');
  Schema = mongoose.Schema;
} catch (e) {
  Schema = function() {
    return {
      virtual: () => ({ get: () => {} }),
      set: () => {}
    };
  };
}
const cloudConnection = require('../config/cloudDb');

const licenseKeySchema = new Schema(
  {
    licenseKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    machineId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'ANYPC000',
    },
    planName: {
      type: String,
      required: true,
      default: 'Gold',
    },
    durationDays: {
      type: Number,
      required: true,
      default: 365,
    },
    issuedTo: {
      type: String,
      default: 'Direct Sale',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'licenses',
  }
);

const LicenseKey = cloudConnection.model('LicenseKey', licenseKeySchema);

module.exports = LicenseKey;
