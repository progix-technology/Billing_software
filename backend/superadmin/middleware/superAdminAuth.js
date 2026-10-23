const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');

const SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET || 'superadmin_cloud_secret_jwt_key_progix_2026_secure';

const protectSuperAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. SuperAdmin access token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, SUPERADMIN_JWT_SECRET);
    const admin = await SuperAdmin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. SuperAdmin account does not exist.',
      });
    }

    req.superAdmin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or expired. Please sign in again.',
    });
  }
};

module.exports = {
  protectSuperAdmin,
  SUPERADMIN_JWT_SECRET,
};
