const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ tenantId: req.user.tenantId }).populate('parent', 'name').sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, subCategories } = req.body;

    const categoryExists = await Category.findOne({ name: name.trim(), tenantId: req.user.tenantId });
    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      tenantId: req.user.tenantId,
      name: name.trim(),
      description,
      parent: null,
    });

    if (subCategories && Array.isArray(subCategories)) {
      for (const subName of subCategories) {
        const cleanedSubName = subName.trim();
        if (cleanedSubName) {
          const exists = await Category.findOne({ name: cleanedSubName, tenantId: req.user.tenantId });
          if (!exists) {
            await Category.create({
              tenantId: req.user.tenantId,
              name: cleanedSubName,
              parent: category._id,
              description: `Subcategory of ${category.name}`,
            });
          } else if (!exists.parent) {
            exists.parent = category._id;
            await exists.save();
          }
        }
      }
    }

    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, subCategories } = req.body;
    let category = await Category.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.name = name ? name.trim() : category.name;
    category.description = description !== undefined ? description : category.description;
    await category.save();

    if (subCategories && Array.isArray(subCategories)) {
      const incomingNames = subCategories.map(s => s.trim()).filter(Boolean);

      const existingSubs = await Category.find({ parent: category._id, tenantId: req.user.tenantId });
      const existingNames = existingSubs.map(s => s.name);

      for (const sub of existingSubs) {
        if (!incomingNames.includes(sub.name)) {
          await sub.deleteOne();
        }
      }

      for (const incomingName of incomingNames) {
        if (!existingNames.includes(incomingName)) {
          const exists = await Category.findOne({ name: incomingName, tenantId: req.user.tenantId });
          if (!exists) {
            await Category.create({
              tenantId: req.user.tenantId,
              name: incomingName,
              parent: category._id,
              description: `Subcategory of ${category.name}`,
            });
          } else if (!exists.parent) {
            exists.parent = category._id;
            await exists.save();
          }
        }
      }
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.deleteMany({ parent: category._id, tenantId: req.user.tenantId });

    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category removed' });
  } catch (error) {
    next(error);
  }
};
