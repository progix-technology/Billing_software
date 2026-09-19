const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Please add a business name'],
      trim: true,
    },
    plan: {
      type: String,
      default: 'basic',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    validTill: {
      type: Date,
      required: [true, 'Please add a validity date'],
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tenant', TenantSchema);
