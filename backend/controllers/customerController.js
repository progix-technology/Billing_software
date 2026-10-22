const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';
    const query = { tenantId: tenantIdToUse };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer profile
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
  try {
    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';
    let customer = await Customer.findOne({ _id: req.params.id, tenantId: tenantIdToUse });
    if (!customer) {
      customer = await Customer.findById(req.params.id);
    }
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, gstNumber, address, notes, outstandingBalance } = req.body;
    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';

    const phoneClean = (phone || '').trim();
    if (!phoneClean) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const phoneExists = await Customer.findOne({
      phone: phoneClean,
      tenantId: tenantIdToUse
    });
    if (phoneExists) {
      if (name && name.trim()) phoneExists.name = name.trim();
      if (email) phoneExists.email = email.trim();
      if (gstNumber) phoneExists.gstNumber = gstNumber.trim();
      if (address) phoneExists.address = address;
      if (notes) phoneExists.notes = notes;
      if (outstandingBalance !== undefined && !isNaN(parseFloat(outstandingBalance))) {
        phoneExists.outstandingBalance = parseFloat(outstandingBalance);
      }
      await phoneExists.save();
      return res.status(200).json({ success: true, customer: phoneExists, message: 'Customer profile updated' });
    }

    const customer = await Customer.create({
      tenantId: tenantIdToUse,
      name: (name || '').trim(),
      phone: phoneClean,
      email: email ? email.trim() : '',
      gstNumber: gstNumber ? gstNumber.trim() : '',
      address: address || '',
      notes: notes || '',
      outstandingBalance: parseFloat(outstandingBalance) || 0,
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user && req.user.tenantId && req.user.role !== 'superadmin') {
      query.tenantId = req.user.tenantId;
    }
    let customer = await Customer.findOne(query);
    if (!customer) {
      customer = await Customer.findById(req.params.id);
    }
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (req.body.phone && req.body.phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone: req.body.phone });
      if (phoneExists && phoneExists._id.toString() !== customer._id.toString()) {
        return res.status(400).json({ success: false, message: 'Phone number already in use' });
      }
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
exports.deleteCustomer = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    if (req.user && req.user.tenantId && req.user.role !== 'superadmin') {
      query.tenantId = req.user.tenantId;
    }
    let customer = await Customer.findOne(query);
    if (!customer) {
      customer = await Customer.findById(req.params.id);
    }
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await Customer.deleteOne({ _id: customer._id });
    res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customer Ledger (Invoices and Payments combined ledger)
// @route   GET /api/customers/:id/ledger
// @access  Private
exports.getCustomerLedger = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findOne({ _id: customerId, tenantId: req.user.tenantId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch invoices
    const invoices = await Invoice.find({ customer: customerId, tenantId: req.user.tenantId }).sort({ createdAt: 1 });
    // Fetch payments
    const payments = await Payment.find({ customer: customerId, tenantId: req.user.tenantId }).sort({ createdAt: 1 });

    // Combine and sort ledger entries
    const ledger = [];

    // Push starting balance
    let runningBalance = 0; // Cumulative tracker

    invoices.forEach((inv) => {
      ledger.push({
        _id: inv._id,
        date: inv.createdAt,
        type: 'INVOICE',
        reference: inv.invoiceNumber,
        debit: inv.grandTotal, // customer owes us
        credit: 0,
        remarks: inv.status,
      });
    });

    payments.forEach((pay) => {
      ledger.push({
        _id: pay._id,
        date: pay.date,
        type: 'PAYMENT',
        reference: pay.paymentReference || 'N/A',
        debit: 0,
        credit: pay.amount, // customer pays us
        remarks: `Method: ${pay.paymentMethod}. ${pay.remarks}`,
      });
    });

    // Sort combined by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute running balances
    const ledgerWithBalance = ledger.map((entry) => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance,
      };
    });

    res.status(200).json({
      success: true,
      customer,
      runningBalance,
      ledger: ledgerWithBalance,
    });
  } catch (error) {
    next(error);
  }
};
