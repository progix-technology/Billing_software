const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { customerId, supplierId, type } = req.query;
    const query = { tenantId: req.user.tenantId };

    if (customerId) query.customer = customerId;
    if (supplierId) query.supplier = supplierId;
    if (type) query.type = type;

    const payments = await Payment.find(query)
      .populate('customer', 'name phone')
      .populate('supplier', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer or supplier payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res, next) => {
  try {
    const {
      customerId,
      supplierId,
      type, // 'INBOUND' (Customer pays us), 'OUTBOUND' (We pay Supplier)
      amount,
      paymentMethod,
      remarks,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount' });
    }

    const payRef = `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    let payment;

    if (type === 'INBOUND') {
      if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer ID is required for inbound payments' });
      }
      const customer = await Customer.findOne({ _id: customerId, tenantId: req.user.tenantId });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      payment = await Payment.create({
        tenantId: req.user.tenantId,
        paymentReference: payRef,
        customer: customerId,
        type: 'INBOUND',
        amount,
        paymentMethod,
        remarks,
      });

      // Customer pays us: reduces what they owe (outstanding balance goes down)
      customer.outstandingBalance -= parseFloat(amount);
      await customer.save();
    } else if (type === 'OUTBOUND') {
      if (!supplierId) {
        return res.status(400).json({ success: false, message: 'Supplier ID is required for outbound payments' });
      }
      const supplier = await Supplier.findOne({ _id: supplierId, tenantId: req.user.tenantId });
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      payment = await Payment.create({
        tenantId: req.user.tenantId,
        paymentReference: payRef,
        supplier: supplierId,
        type: 'OUTBOUND',
        amount,
        paymentMethod,
        remarks,
      });

      // We pay supplier: reduces what we owe them (outstanding balance goes down)
      supplier.outstandingBalance -= parseFloat(amount);
      await supplier.save();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment type. Must be INBOUND or OUTBOUND' });
    }

    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};
