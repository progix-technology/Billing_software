const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { protectSuperAdmin } = require('../middleware/superAdminAuth');
const { superAdminLoginLimiter, licenseGenLimiter } = require('../middleware/rateLimiter');

// Public SuperAdmin Authentication with Rate Limiting (5 attempts / 15 mins)
router.post('/login', superAdminLoginLimiter, superAdminController.login);

// Protected SuperAdmin Endpoints
router.use(protectSuperAdmin);

router.get('/me', superAdminController.getMe);
router.get('/dashboard-stats', superAdminController.getDashboardStats);

// License Keys Generation & Revocation
router.post('/licenses/generate', licenseGenLimiter, superAdminController.generateKey);
router.get('/licenses', superAdminController.getLicenses);
router.put('/licenses/:id/revoke', superAdminController.revokeLicense);

// Client Admins / Stores Management in MongoDB Atlas
router.get('/clients', superAdminController.getClients);
router.post('/clients', superAdminController.createClient);
router.put('/clients/:id', superAdminController.updateClient);
router.delete('/clients/:id', superAdminController.deleteClient);

module.exports = router;
