const { getLicenseStatus } = require('../services/licenseService');

// Middleware to block critical billing/inventory mutations when license is expired
const checkLicense = async (req, res, next) => {
  try {
    const status = await getLicenseStatus();

    if (!status.isActivated || status.isExpired) {
      return res.status(403).json({
        success: false,
        isLicenseExpired: true,
        message: 'Your software is not activated or subscription has expired. Please enter your activation key or contact support (+91 89532 08952).',
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
