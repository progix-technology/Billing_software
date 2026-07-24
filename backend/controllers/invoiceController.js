const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryLog = require('../models/InventoryLog');
const PDFDocument = require('pdfkit');

// Generate invoice number automatically
const generateInvoiceNumber = async () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');

  const count = await Invoice.countDocuments();
  const sequence = (count + 1).toString().padStart(4, '0');
  
  return `INV-${dateStr}-${sequence}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { search, status, paymentMethod, page = 1, limit = 50 } = req.query;
    const query = {};

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
    const invoice = await Invoice.findById(req.params.id)
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
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      items, // array of { productId, quantity, discountPercentage, isInterstate }
      paidAmount = 0,
      paymentMethod = 'CASH',
      remarks,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one item' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    const invoiceItems = [];

    // Process items and calculate pricing
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${product.name}'. Current stock: ${product.stockQuantity}, requested: ${item.quantity}`,
        });
      }

      // Calculations
      const unitPrice = product.sellingPrice;
      const quantity = parseInt(item.quantity);
      const grossAmount = unitPrice * quantity;
      
      const discPercent = parseFloat(item.discountPercentage) || 0;
      const discountAmount = parseFloat(((grossAmount * discPercent) / 100).toFixed(2));
      
      const taxableAmount = grossAmount - discountAmount;
      
      // GST breakdown
      const gstRate = product.gstPercentage || 0;
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
        quantity,
        purchasePrice: product.purchasePrice,
        unitPrice,
        gstPercentage: gstRate,
        cgst,
        sgst,
        igst,
        discountPercentage: discPercent,
        discountAmount,
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

    const invoiceNumber = await generateInvoiceNumber();

    // Create Invoice inside DB
    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customerId,
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
      cashier: req.user.id,
    });

    // Deduct stock levels and write logs
    for (const item of invoiceItems) {
      const product = await Product.findById(item.product);
      const prevStock = product.stockQuantity;
      const currentStock = prevStock - item.quantity;
      
      product.stockQuantity = currentStock;
      await product.save();

      await InventoryLog.create({
        product: product._id,
        type: 'OUT',
        quantity: item.quantity,
        previousStock: prevStock,
        currentStock,
        referenceId: invoiceNumber,
        remarks: 'Sales Invoice',
        user: req.user.id,
      });
    }

    // Update Customer Outstanding Balance if unpaid/partial
    if (balanceAmount > 0) {
      customer.outstandingBalance += balanceAmount;
      await customer.save();
    } else if (balanceAmount < 0) {
      // In case they paid extra, record as credit
      customer.outstandingBalance += balanceAmount; // balanceAmount is negative, reducing what they owe or increasing credit
      await customer.save();
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate PDF Invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
exports.getInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('cashier', 'username');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);

    doc.pipe(res);

    // Add company logo / details
    doc.fontSize(20).text('ENTERPRISE BILLING SOLUTIONS', { align: 'center' });
    doc.fontSize(10).text('GSTIN: 27AAAAA1111A1Z1 | Address: Main Street, Pune, India', { align: 'center' });
    doc.moveDown();

    // Invoice Meta
    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`, { bold: true });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Cashier: ${invoice.cashier.username}`);
    doc.text(`Payment Method: ${invoice.paymentMethod}`);
    doc.text(`Payment Status: ${invoice.status}`);
    doc.moveDown();

    // Customer Meta
    doc.text('Bill To:', { underline: true });
    doc.text(`Customer Name: ${invoice.customer.name}`);
    doc.text(`Phone: ${invoice.customer.phone}`);
    if (invoice.customer.gstNumber) {
      doc.text(`GST Number: ${invoice.customer.gstNumber}`);
    }
    doc.moveDown();

    // Table Header
    doc.fontSize(10);
    const tableTop = 260;
    doc.text('Item Description', 50, tableTop);
    doc.text('Qty', 250, tableTop, { width: 30, align: 'right' });
    doc.text('Price', 300, tableTop, { width: 50, align: 'right' });
    doc.text('GST %', 370, tableTop, { width: 40, align: 'right' });
    doc.text('Disc %', 430, tableTop, { width: 40, align: 'right' });
    doc.text('Total', 490, tableTop, { width: 70, align: 'right' });
    
    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    // Table Items
    let currentY = tableTop + 25;
    invoice.items.forEach((item) => {
      doc.text(item.name, 50, currentY, { width: 180 });
      doc.text(item.quantity.toString(), 250, currentY, { width: 30, align: 'right' });
      doc.text(item.unitPrice.toFixed(2), 300, currentY, { width: 50, align: 'right' });
      doc.text(`${item.gstPercentage}%`, 370, currentY, { width: 40, align: 'right' });
      doc.text(`${item.discountPercentage}%`, 430, currentY, { width: 40, align: 'right' });
      doc.text(item.total.toFixed(2), 490, currentY, { width: 70, align: 'right' });
      
      currentY += 20;
    });

    doc.moveTo(50, currentY).lineTo(560, currentY).stroke();
    currentY += 15;

    // Totals
    doc.text('Subtotal:', 380, currentY, { width: 100, align: 'right' });
    doc.text(invoice.subTotal.toFixed(2), 490, currentY, { width: 70, align: 'right' });
    currentY += 15;

    doc.text('Total GST:', 380, currentY, { width: 100, align: 'right' });
    doc.text(invoice.totalGst.toFixed(2), 490, currentY, { width: 70, align: 'right' });
    currentY += 15;

    doc.text('Total Discount:', 380, currentY, { width: 100, align: 'right' });
    doc.text(invoice.totalDiscount.toFixed(2), 490, currentY, { width: 70, align: 'right' });
    currentY += 15;

    doc.fontSize(12).text('Grand Total:', 380, currentY, { width: 100, align: 'right', bold: true });
    doc.text(invoice.grandTotal.toFixed(2), 490, currentY, { width: 70, align: 'right', bold: true });
    currentY += 20;

    doc.fontSize(10).text('Paid Amount:', 380, currentY, { width: 100, align: 'right' });
    doc.text(invoice.paidAmount.toFixed(2), 490, currentY, { width: 70, align: 'right' });
    currentY += 15;

    doc.text('Balance Due:', 380, currentY, { width: 100, align: 'right' });
    doc.text(invoice.balanceAmount.toFixed(2), 490, currentY, { width: 70, align: 'right' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
