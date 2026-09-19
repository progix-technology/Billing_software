const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { tenantId: req.user.tenantId };

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
    const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
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

    const phoneExists = await Customer.findOne({ phone: phone.trim(), tenantId: req.user.tenantId });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
    }

    const customer = await Customer.create({
      tenantId: req.user.tenantId,
      name,
      phone: phone.trim(),
      email,
      gstNumber,
      address,
      notes,
      outstandingBalance: outstandingBalance || 0,
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
    let customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (req.body.phone && req.body.phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone: req.body.phone, tenantId: req.user.tenantId });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Phone number already in use' });
      }
    }

    customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body, 
      { new: true, runValidators: true }
    );

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
    const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await customer.deleteOne();
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
