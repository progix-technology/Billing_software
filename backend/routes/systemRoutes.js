const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const systemController = require('../controllers/systemController');

// Public route to check maintenance status
router.get('/settings', systemController.getSystemSettings);

// Private route for superadmin to update settings
router.put('/settings', protect, authorize('superadmin'), systemController.updateSystemSettings);

module.exports = router;
