const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  purchasePrice: {
    type: Number,
    required: true,
    default: 0,
  },
  unitPrice: {
    type: Number, // Selling price
    required: true,
  },
  gstPercentage: {
    type: Number,
    required: true,
    default: 0,
  },
  cgst: {
    type: Number,
    required: true,
    default: 0,
  },
  sgst: {
    type: Number,
    required: true,
    default: 0,
  },
  igst: {
    type: Number,
    required: true,
    default: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    items: [InvoiceItemSchema],
    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalGst: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'CREDIT', 'MIXED'],
      default: 'CASH',
    },
    status: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'PAID',
    },
    remarks: {
      type: String,
      default: '',
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ invoiceNumber: 'text', status: 'text' });

module.exports = mongoose.model('Invoice', InvoiceSchema);
