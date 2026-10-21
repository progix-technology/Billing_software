const { getLicenseStatus } = require('../services/licenseService');

// Middleware to block critical billing/inventory mutations when license is expired
const checkLicense = async (req, res, next) => {
  try {
    const status = await getLicenseStatus();

    if (status.isExpired) {
      return res.status(403).json({
        success: false,
        isLicenseExpired: true,
        message: 'Your subscription has expired. Please enter a valid license key or contact support (+91 89532 08952) to renew.',
        machineId: status.machineId,
        expiresAt: status.expiresAt,
      });
    }

    next();
  } catch (err) {
    next();
  }
};

module.exports = { checkLicense };
