
const jwt = require('jsonwebtoken');
const SystemSetting = require('../models/SystemSetting');

// Protect Routes (JWT Validation)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforbillingsoftware12345');
      } catch (err1) {
        const { SUPERADMIN_JWT_SECRET } = require('../superadmin/middleware/superAdminAuth');
        decoded = jwt.verify(token, SUPERADMIN_JWT_SECRET);
      }

      // Add user info from payload to request
      req.user = {
        id: decoded.id,
        role: decoded.role,
        username: decoded.username || (decoded.role === 'superadmin' ? 'SuperAdmin' : 'User'),
        email: decoded.email,
        tenantId: decoded.tenantId || (decoded.role === 'superadmin' ? 'superadmin_cloud_tenant' : undefined)
      };

      // Check Maintenance Mode for non-superadmins
      if (req.user.role !== 'superadmin') {
        const settings = await SystemSetting.findOne({ key: 'global' });
        if (settings && settings.isMaintenanceMode) {
          return res.status(503).json({
            success: false,
            message: settings.maintenanceMessage || 'System is under maintenance. Please try again later.',
            isMaintenanceMode: true
          });
        }
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Role authorization check middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    // SuperAdmin has unrestricted master access to all operations
    if (req.user && req.user.role === 'superadmin') {
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
