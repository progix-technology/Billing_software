const rateLimit = require('express-rate-limit');

// 1. Strict Brute-Force Protection on SuperAdmin Login
// Blocks IP after 10 failed/consecutive login requests in 15 minutes
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
});

// 2. Anti-Dictionary / Anti-Key Harvesting Protection on License Verification
// Limits verification hits to 30 per minute per client IP
exports.verifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 verifications per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    valid: false,
    message: 'Too many license verification requests from this IP. Please wait a moment and try again.',
  },
});

// 3. General API Protection against DDoS / flood attacks
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Max 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please slow down.',
  },
});
