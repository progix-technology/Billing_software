const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

// Helper to generate SKU if not provided
const generateSKU = (productName) => {
  const prefix = productName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD');
  const uniqueNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${uniqueNum}`;
};

// Helper to generate sequential 8-digit barcode
const generateSequentialBarcode = async () => {
  const lastProduct = await Product.findOne({ barcode: { $regex: /^\d{8}$/ } })
    .sort({ barcode: -1 })
    .exec();

  let nextNum = 1;
  if (lastProduct && lastProduct.barcode) {
    nextNum = parseInt(lastProduct.barcode, 10) + 1;
  }
  
  return nextNum.toString().padStart(8, '0');
};

// @desc    Get all products (with pagination, filters, search)
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50, lowStock } = req.query;
    const query = {};

    if (category) {
      query.$or = [
        { category: category },
        { subCategory: category }
      ];
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter low stock products
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stockQuantity', '$minStockLevel'] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('subCategory', 'name');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Admin or Manager)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      subCategory,
      description,
      purchasePrice,
      sellingPrice,
      gstPercentage,
      stockQuantity,
      minStockLevel,
      image,
    } = req.body;

    const finalSku = sku ? sku.trim() : generateSKU(name);

    // Check SKU unique
    const skuExists = await Product.findOne({ sku: finalSku });
    if (skuExists) {
      return res.status(400).json({ success: false, message: `SKU '${finalSku}' is already in use.` });
    }

    // Check Barcode unique if provided
    let finalBarcode = barcode ? barcode.trim() : undefined;
    if (finalBarcode) {
      const barcodeExists = await Product.findOne({ barcode: finalBarcode });
      if (barcodeExists) {
        return res.status(400).json({ success: false, message: 'Barcode is already in use.' });
      }
    } else {
      finalBarcode = await generateSequentialBarcode();
    }

    const product = await Product.create({
      name,
      sku: finalSku,
      barcode: finalBarcode,
      category,
      subCategory: subCategory || null,
      description,
      purchasePrice,
      sellingPrice,
      gstPercentage,
      stockQuantity: stockQuantity || 0,
      minStockLevel: minStockLevel || 5,
      image: image || '',
    });

    // Create Initial Inventory Log
    await InventoryLog.create({
      product: product._id,
      type: 'IN',
      quantity: product.stockQuantity,
      previousStock: 0,
      currentStock: product.stockQuantity,
      referenceId: 'INITIAL_STOCK',
      remarks: 'Product initialized in inventory',
      user: req.user.id,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin or Manager)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldStock = product.stockQuantity;
    const { stockQuantity, ...otherData } = req.body;

    // SKU uniqueness check if changing
    if (otherData.sku && otherData.sku !== product.sku) {
      const skuExists = await Product.findOne({ sku: otherData.sku });
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'SKU is already in use.' });
      }
    }

    // Barcode uniqueness check if changing
    if (otherData.barcode && otherData.barcode !== product.barcode) {
      const barcodeExists = await Product.findOne({ barcode: otherData.barcode });
      if (barcodeExists) {
        return res.status(400).json({ success: false, message: 'Barcode is already in use.' });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, otherData, {
      new: true,
      runValidators: true,
    });

    // Handle manual stock level adjustment
    if (stockQuantity !== undefined && stockQuantity !== oldStock) {
      const qtyDiff = stockQuantity - oldStock;
      product.stockQuantity = stockQuantity;
      await product.save();

      await InventoryLog.create({
        product: product._id,
        type: qtyDiff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(qtyDiff),
        previousStock: oldStock,
        currentStock: stockQuantity,
        referenceId: 'MANUAL_ADJUSTMENT',
        remarks: 'Manual inventory adjustment',
        user: req.user.id,
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin or Manager)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Record product purchase (Stock In)
// @route   POST /api/products/:id/stock-in
// @access  Private (Admin or Manager)
exports.stockIn = async (req, res, next) => {
  try {
    const { quantity, supplierPrice, remarks, referenceId } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stockQuantity;
    const currentStock = previousStock + parseInt(quantity);

    product.stockQuantity = currentStock;
    if (supplierPrice) {
      product.purchasePrice = supplierPrice; // Update purchase price
    }
    await product.save();

    await InventoryLog.create({
      product: product._id,
      type: 'IN',
      quantity: parseInt(quantity),
      previousStock,
      currentStock,
      referenceId: referenceId || 'PURCHASE_STOCK',
      remarks: remarks || 'Supplier stock inward',
      user: req.user.id,
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products list
// @route   GET /api/products/alerts/low-stock
// @access  Private
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] },
    }).populate('category', 'name').populate('subCategory', 'name');

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product inventory adjustment logs
// @route   GET /api/products/:id/logs
// @access  Private
exports.getProductLogs = async (req, res, next) => {
  try {
    const logs = await InventoryLog.find({ product: req.params.id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inventory logs (global history)
// @route   GET /api/products/inventory/logs
// @access  Private
exports.getAllInventoryLogs = async (req, res, next) => {
  try {
    const logs = await InventoryLog.find()
      .populate('product', 'name sku barcode')
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};
