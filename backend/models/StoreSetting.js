const mongoose = require('mongoose');

const StoreSettingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    storeName: {
      type: String,
      default: 'Enterprise Billing Solutions',
      trim: true,
    },
    storeGst: {
      type: String,
      default: '27AAAAA1111A1Z1',
      trim: true,
    },
    storeAddress: {
      type: String,
      default: 'Main Street, Pune, Maharashtra, India',
      trim: true,
    },
    storePhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    dashboardBanner: {
      type: String, // Base64 encoded image string
      default: '',
    },
    gstSlabs: {
      type: [Number],
      default: [0, 5, 12, 18, 28],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSetting', StoreSettingSchema);
