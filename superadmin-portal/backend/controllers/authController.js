const SuperAdmin = require('../models/SuperAdmin');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Auto initialize root SuperAdmin if none exists
const seedSuperAdmin = async () => {
  try {
    const count = await SuperAdmin.countDocuments();
    if (count === 0) {
      const email = process.env.SUPERADMIN_EMAIL || 'superadmin@gmail.com';
      const password = process.env.SUPERADMIN_PASSWORD || 'Password@123';
      const username = process.env.SUPERADMIN_USERNAME || 'SuperAdmin';
      
      await SuperAdmin.create({ username, email, password });
      console.log(`[SuperAdmin Initialized] Root email: ${email}`);
    }
  } catch (err) {
    console.error('SuperAdmin seed check failed:', err.message);
  }
};

// @desc    SuperAdmin Login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const admin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current SuperAdmin Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const admin = await SuperAdmin.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, user: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await SuperAdmin.findById(req.user.id);

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedSuperAdmin = seedSuperAdmin;
