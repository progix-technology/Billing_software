const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const packageController = require('../controllers/packageController');

// All package management routes require superadmin access
// Get packages could be public if there is a pricing page, but for now we'll protect it
router.route('/')
  .get(protect, authorize('superadmin'), packageController.getPackages)
  .post(protect, authorize('superadmin'), packageController.createPackage);

router.route('/:id')
  .put(protect, authorize('superadmin'), packageController.updatePackage)
  .delete(protect, authorize('superadmin'), packageController.deletePackage);

module.exports = router;
