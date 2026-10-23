const { Schema } = require('mongoose');
const cloudConnection = require('../config/cloudDb');

const clientAdminSchema = new Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
      trim: true,
    },
    machineId: {
      type: String,
      trim: true,
      default: 'ANYPC000',
    },
    planName: {
      type: String,
      default: 'Standard',
    },
    licenseKey: {
      type: String,
      default: '',
    },
    durationDays: {
      type: Number,
      default: 365,
    },
    validTill: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'expired'],
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'tenants',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

clientAdminSchema.virtual('businessName').get(function() {
  return this.storeName;
});
clientAdminSchema.virtual('plan').get(function() {
  return this.planName;
});
clientAdminSchema.virtual('contactEmail').get(function() {
  return this.email;
});

const ClientAdmin = cloudConnection.model('ClientAdmin', clientAdminSchema);

module.exports = ClientAdmin;
