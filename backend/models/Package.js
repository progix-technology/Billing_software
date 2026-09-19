const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a package name'],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a package price'],
    },
    durationMonths: {
      type: Number,
      default: 1, // 1 for monthly, 12 for yearly
    },
    features: {
      type: [String],
      default: [],
    },
    maxAdmins: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Package', PackageSchema);
