const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryLog = require('../models/InventoryLog');


// Generate invoice number automatically
const generateInvoiceNumber = async (tenantId) => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');

  const count = await Invoice.countDocuments({ tenantId });
  const sequence = (count + 1).toString().padStart(4, '0');
  
  return `INV-${dateStr}-${sequence}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { search, status, paymentMethod, page = 1, limit = 50 } = req.query;
    const query = { tenantId: req.user.tenantId };

    if (status) {
      query.status = status;
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    let customerIds = [];
    if (search) {
      // Search by customer name
      const customers = await Customer.find({
        tenantId: req.user.tenantId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
      customerIds = customers.map(c => c._id);

      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customerIds } }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name phone gstNumber')
      .populate('cashier', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice details
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate('customer')
      .populate('items.product')
      .populate('cashier', 'username');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      items, // array of { productId, quantity, discountPercentage, gstPercentage, isInterstate }
      paidAmount = 0,
      paymentMethod = 'CASH',
      remarks,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one item' });
    }

    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';

    let customer = null;
    if (customerId && customerId !== 'walk-in') {
      customer = await Customer.findOne({ _id: customerId, tenantId: tenantIdToUse });
      if (!customer) {
        customer = await Customer.findById(customerId);
      }
    }

    // Default Walk-in Customer fallback if no customer selected or specified as walk-in
    if (!customer) {
      customer = await Customer.findOne({ phone: '0000000000', tenantId: tenantIdToUse });
      if (!customer) {
        customer = await Customer.create({
          tenantId: tenantIdToUse,
          name: 'Walk-in Customer',
          phone: '0000000000',
          address: 'Store Front',
          outstandingBalance: 0,
        });
      }
    }

    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    const invoiceItems = [];

    // Process items and calculate pricing
    for (const item of items) {
      let product = await Product.findOne({ _id: item.productId, tenantId: tenantIdToUse });
      if (!product) {
        product = await Product.findById(item.productId);
      }
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      // Calculations
      const unitPrice = Number(product.sellingPrice) || 0;
      const quantity = parseInt(item.quantity) || 1;
      const grossAmount = unitPrice * quantity;

      const discPercent = parseFloat(item.discountPercentage) || 0;
      const discountAmount = parseFloat(((grossAmount * discPercent) / 100).toFixed(2));

      const taxableAmount = grossAmount - discountAmount;

      // GST breakdown (supports item manual override or product default)
      const gstRate = item.gstPercentage !== undefined ? (parseFloat(item.gstPercentage) || 0) : (product.gstPercentage || 0);
      const gstAmount = parseFloat(((taxableAmount * gstRate) / 100).toFixed(2));

      let cgst = 0, sgst = 0, igst = 0;
      if (item.isInterstate) {
        igst = gstAmount;
      } else {
        cgst = parseFloat((gstAmount / 2).toFixed(2));
        sgst = parseFloat((gstAmount / 2).toFixed(2));
      }

      const totalItemAmount = taxableAmount + gstAmount;

      invoiceItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        hsnCode: product.hsnCode || item.hsnCode || '',
        quantity,
        purchasePrice: product.purchasePrice,
        unitPrice,
        gstPercentage: gstRate,
        cgst,
        sgst,
        igst,
        discountPercentage: discPercent,
        discountAmount,
        taxableAmount,
        total: totalItemAmount,
      });

      subTotal += taxableAmount;
      totalDiscount += discountAmount;
      totalGst += gstAmount;
    }

    const grandTotal = Math.round(subTotal + totalGst);
    const balanceAmount = parseFloat((grandTotal - paidAmount).toFixed(2));

    let status = 'PAID';
    if (balanceAmount > 0) {
      status = paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    }

    const invoiceNumber = await generateInvoiceNumber(tenantIdToUse);

    // Create Invoice inside DB
    const invoice = await Invoice.create({
      tenantId: tenantIdToUse,
      invoiceNumber,
      customer: customer._id,
      items: invoiceItems,
      subTotal,
      totalDiscount,
      totalGst,
      grandTotal,
      paidAmount,
      balanceAmount,
      paymentMethod,
      status,
      remarks,
      cashier: req.user ? req.user.id : undefined,
    });

    // Deduct stock levels and write logs
    for (const item of invoiceItems) {
      let product = await Product.findOne({ _id: item.product, tenantId: tenantIdToUse });
      if (!product) {
        product = await Product.findById(item.product);
      }
      if (product) {
        const prevStock = Number(product.stockQuantity) || 0;
        const currentStock = prevStock - item.quantity;
        product.stockQuantity = currentStock;
        await product.save();

        await InventoryLog.create({
          tenantId: tenantIdToUse,
          product: product._id,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: prevStock,
          currentStock,
          referenceId: invoiceNumber,
          remarks: 'Sales Invoice',
          user: req.user ? req.user.id : undefined,
        });
      }
    }

    // Update Customer Outstanding Balance if unpaid/partial
    if (customer && Math.abs(balanceAmount) > 0.001) {
      customer.outstandingBalance = (Number(customer.outstandingBalance) || 0) + balanceAmount;
      await customer.save();
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};


