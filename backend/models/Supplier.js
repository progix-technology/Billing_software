const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please add a supplier name'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    outstandingBalance: {
      type: Number,
      default: 0, // Positive means we owe the supplier, negative means supplier owes us
    },
  },
  {
    timestamps: true,
  }
);

SupplierSchema.index({ name: 'text', contactPerson: 'text', phone: 'text' });

module.exports = mongoose.model('Supplier', SupplierSchema);
