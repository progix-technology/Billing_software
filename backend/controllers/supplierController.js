const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const InventoryLog = require('../models/InventoryLog');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { tenantId: req.user.tenantId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      suppliers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier details
// @route   GET /api/suppliers/:id
// @access  Private
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin or Manager)
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, gstNumber, address, outstandingBalance } = req.body;

    const phoneExists = await Supplier.findOne({ phone: phone.trim(), tenantId: req.user.tenantId });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Supplier with this phone number already exists' });
    }

    const supplier = await Supplier.create({
      tenantId: req.user.tenantId,
      name,
      contactPerson,
      phone: phone.trim(),
      email,
      gstNumber,
      address,
      outstandingBalance: outstandingBalance || 0,
    });

    res.status(201).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin or Manager)
exports.updateSupplier = async (req, res, next) => {
  try {
    let supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (req.body.phone && req.body.phone !== supplier.phone) {
      const phoneExists = await Supplier.findOne({ phone: req.body.phone, tenantId: req.user.tenantId });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Phone number already in use' });
      }
    }

    supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body, 
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin or Manager)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await supplier.deleteOne();
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Supplier Ledger (Inward Stock logs vs Outbound Payments combined)
// @route   GET /api/suppliers/:id/ledger
// @access  Private
exports.getSupplierLedger = async (req, res, next) => {
  try {
    const supplierId = req.params.id;
    const supplier = await Supplier.findOne({ _id: supplierId, tenantId: req.user.tenantId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // We can pull payments
    const payments = await Payment.find({ supplier: supplierId, tenantId: req.user.tenantId }).sort({ createdAt: 1 });

    // We can fetch inventory logs that correspond to supplier purchases (stock inward)
    // For simplicity, let's look for InventoryLogs where type = 'IN' and remarks contain 'Supplier' or referenceId is purchase
    const purchases = await InventoryLog.find({
      tenantId: req.user.tenantId,
      type: 'IN',
      remarks: { $regex: 'Supplier', $options: 'i' },
    }).populate('product').sort({ createdAt: 1 });

    const ledger = [];
    let runningBalance = 0; // Cumulative balance

    purchases.forEach((p) => {
      // Approximate purchase total = p.quantity * p.product.purchasePrice
      const purchasePrice = p.product ? p.product.purchasePrice : 0;
      const totalAmount = p.quantity * purchasePrice;
      if (totalAmount > 0) {
        ledger.push({
          _id: p._id,
          date: p.createdAt,
          type: 'PURCHASE',
          reference: p.referenceId || 'STOCK_IN',
          credit: totalAmount, // we owe supplier
          debit: 0,
          remarks: `Inward: ${p.product ? p.product.name : 'Unknown Product'} (Qty: ${p.quantity})`,
        });
      }
    });

    payments.forEach((pay) => {
      ledger.push({
        _id: pay._id,
        date: pay.date,
        type: 'PAYMENT',
        reference: pay.paymentReference || 'N/A',
        credit: 0,
        debit: pay.amount, // we paid supplier
        remarks: `Method: ${pay.paymentMethod}. ${pay.remarks}`,
      });
    });

    // Sort by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    const ledgerWithBalance = ledger.map((entry) => {
      runningBalance = runningBalance + entry.credit - entry.debit;
      return {
        ...entry,
        balance: runningBalance,
      };
    });

    res.status(200).json({
      success: true,
      supplier,
      runningBalance,
      ledger: ledgerWithBalance,
    });
  } catch (error) {
    next(error);
  }
};
