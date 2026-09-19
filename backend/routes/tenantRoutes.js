const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantController = require('../controllers/tenantController');

// All routes require superadmin access
router.use(protect);
router.use(authorize('superadmin'));

router.route('/')
  .get(tenantController.getTenants)
  .post(tenantController.createTenant);

router.route('/:id')
  .get(tenantController.getTenant)
  .put(tenantController.updateTenant)
  .delete(tenantController.deleteTenant);

router.route('/:id/users/:userId/password')
  .put(tenantController.resetAdminPassword);

module.exports = router;
