const express = require('express');
const router = express.Router();
const {
  getTenants,
  createTenant,
  renewTenant,
  toggleTenantStatus,
  updateTenant,
  deleteTenant
} = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTenants)
  .post(createTenant);

router.route('/:id')
  .put(updateTenant)
  .delete(deleteTenant);

router.post('/:id/renew', renewTenant);
router.put('/:id/status', toggleTenantStatus);

module.exports = router;
