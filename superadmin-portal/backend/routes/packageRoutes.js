const express = require('express');
const router = express.Router();
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPackages); // can be public or protected
router.post('/', protect, createPackage);
router.put('/:id', protect, updatePackage);
router.delete('/:id', protect, deletePackage);

module.exports = router;
