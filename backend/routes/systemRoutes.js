const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const systemController = require('../controllers/systemController');

// Public route to check maintenance status
router.get('/settings', systemController.getSystemSettings);

// Public route to check activation & memory setup status
router.get('/setup-status', systemController.getSetupStatus);

// Public route for initial manual store & admin setup on client PC
router.post('/initial-setup', systemController.initialSetup);

// Private route for superadmin to update settings
router.put('/settings', protect, authorize('superadmin'), systemController.updateSystemSettings);

module.exports = router;
