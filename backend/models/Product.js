const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please add a product SKU'],
      unique: true,
      trim: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple nulls if barcode not assigned
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Please add a purchase price'],
      default: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add a selling price'],
      default: 0,
    },
    gstPercentage: {
      type: Number,
      required: [true, 'Please add a GST percentage'],
      enum: [0, 3, 5, 12, 18, 28],
      default: 18,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Please add a stock quantity'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: [true, 'Please add a minimum stock level for alerts'],
      default: 5,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes for barcode and sku
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
