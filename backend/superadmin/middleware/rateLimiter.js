const rateLimit = require('express-rate-limit');

// Strict Rate Limiting for SuperAdmin Login (Max 5 attempts / 15 minutes)
const superAdminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed SuperAdmin login attempts. Please wait 15 minutes before trying again.',
  },
});

// Rate Limiting for License Key Generation (Max 30 requests / minute)
const licenseGenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many license generation requests. Please slow down.',
  },
});

module.exports = {
  superAdminLoginLimiter,
  licenseGenLimiter,
};
