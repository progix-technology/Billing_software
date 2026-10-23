let Schema;
try {
  const mongoose = require('mongoose');
  Schema = mongoose.Schema;
} catch (e) {
  Schema = function() {
    return {
      pre: () => {},
      methods: {}
    };
  };
}
const bcrypt = require('bcryptjs');
const cloudConnection = require('../config/cloudDb');

const superAdminSchema = new Schema(
  {
    username: {
      type: String,
      default: 'SuperAdmin',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: 'superadmin',
      enum: ['superadmin'],
    },
  },
  {
    timestamps: true,
    collection: 'superadmins',
  }
);

// Hash password before saving if modified
superAdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password helper
superAdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const SuperAdmin = cloudConnection.model('SuperAdmin', superAdminSchema);

module.exports = SuperAdmin;
