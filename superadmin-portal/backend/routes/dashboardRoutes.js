const express = require('express');
const router = express.Router();
const {
  getStats,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/settings', getSystemSettings); // desktop apps can check maintenance status
router.put('/settings', protect, updateSystemSettings);

module.exports = router;
