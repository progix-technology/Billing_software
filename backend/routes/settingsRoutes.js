const express = require('express');
const router = express.Router();
const { backupDatabase, restoreDatabase, getStoreSettings, saveStoreSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// GET store settings (accessible by all authenticated users)
router.get('/', getStoreSettings);

// POST store settings (admin only)
router.post('/', authorize('admin'), saveStoreSettings);

// Backup and restore routes (admin only)
router.get('/backup', authorize('admin'), backupDatabase);
router.post('/restore', authorize('admin'), restoreDatabase);

module.exports = router;

