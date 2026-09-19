const Package = require('../models/Package');

// @desc    Get all packages
// @route   GET /api/packages
// @access  Public (or Private for superadmin, but might be needed for public pricing page later)
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await Package.find().sort({ price: 1 });
    res.status(200).json({ success: true, count: packages.length, packages });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new package
// @route   POST /api/packages
// @access  Private (Superadmin)
exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json({ success: true, package: pkg });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a package
// @route   PUT /api/packages/:id
// @access  Private (Superadmin)
exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, package: pkg });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (soft delete) a package
// @route   DELETE /api/packages/:id
// @access  Private (Superadmin)
exports.deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    // Instead of deleting, we deactivate so existing tenants don't lose references
    pkg.isActive = false;
    await pkg.save();

    res.status(200).json({ success: true, message: 'Package deactivated' });
  } catch (error) {
    next(error);
  }
};
