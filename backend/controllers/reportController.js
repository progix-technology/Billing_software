const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const XLSX = require('xlsx');

// @desc    Get GST/Tax summary reports
// @route   GET /api/reports/gst
// @access  Private
exports.getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { tenantId: req.user.tenantId };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    // Unwind invoice items to aggregate GST taxes by percentage
    const taxSummary = await Invoice.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.gstPercentage',
          taxableValue: {
            $sum: {
              $subtract: [
                { $multiply: ['$items.unitPrice', '$items.quantity'] },
                '$items.discountAmount'
              ]
            }
          },
          cgst: { $sum: '$items.cgst' },
          sgst: { $sum: '$items.sgst' },
          igst: { $sum: '$items.igst' },
          totalTax: { $sum: { $add: ['$items.cgst', '$items.sgst', '$items.igst'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, taxSummary });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profit & loss details
// @route   GET /api/reports/profit-loss
// @access  Private (Admin or Manager)
exports.getProfitLossReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};

    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
    }

    // 1. Calculate sales revenue and cost of goods sold (COGS)
    const matchQuery = { tenantId: req.user.tenantId };
    if (startDate || endDate) {
      matchQuery.createdAt = dateQuery.createdAt;
    }
    const invoices = await Invoice.find(matchQuery);

    let totalRevenue = 0;
    let totalCogs = 0; // Purchase cost of items sold
    let totalDiscountGiven = 0;

    invoices.forEach((inv) => {
      totalRevenue += inv.grandTotal;
      totalDiscountGiven += inv.totalDiscount;
      inv.items.forEach((item) => {
        totalCogs += item.quantity * (item.purchasePrice || 0);
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit;

    res.status(200).json({
      success: true,
      report: {
        totalRevenue,
        totalCogs,
        totalDiscountGiven,
        grossProfit,
        netProfit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Sales Report to Excel sheet
// @route   GET /api/reports/sales/excel
// @access  Private (Admin or Manager)
exports.exportSalesExcel = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { tenantId: req.user.tenantId };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const invoices = await Invoice.find(match)
      .populate('customer', 'name phone')
      .populate('cashier', 'username')
      .sort({ createdAt: -1 });

    // Prepare rows
    const data = invoices.map((inv) => ({
      'Invoice Number': inv.invoiceNumber,
      'Date': new Date(inv.createdAt).toLocaleDateString(),
      'Customer': inv.customer ? inv.customer.name : 'Walk-in',
      'Phone': inv.customer ? inv.customer.phone : 'N/A',
      'Sub Total': inv.subTotal,
      'Total Discount': inv.totalDiscount,
      'Total GST': inv.totalGst,
      'Grand Total': inv.grandTotal,
      'Paid Amount': inv.paidAmount,
      'Balance Due': inv.balanceAmount,
      'Payment Method': inv.paymentMethod,
      'Status': inv.status,
      'Cashier': inv.cashier ? inv.cashier.username : 'System',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    // Create spreadsheet buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=SalesReport.xlsx');
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Stock Level Report to Excel sheet
// @route   GET /api/reports/stock/excel
// @access  Private (Admin or Manager)
exports.exportStockExcel = async (req, res, next) => {
  try {
    const products = await Product.find({ tenantId: req.user.tenantId }).populate('category', 'name').sort({ stockQuantity: 1 });

    const data = products.map((p) => ({
      'Product Name': p.name,
      'SKU': p.sku,
      'Barcode': p.barcode || 'N/A',
      'Category': p.category ? p.category.name : 'Uncategorized',
      'Purchase Price': p.purchasePrice,
      'Selling Price': p.sellingPrice,
      'GST %': p.gstPercentage,
      'Stock Level': p.stockQuantity,
      'Min Alert Level': p.minStockLevel,
      'Low Stock Alert': p.stockQuantity <= p.minStockLevel ? 'YES' : 'NO',
      'Stock Valuation (Purchase)': p.stockQuantity * p.purchasePrice,
      'Stock Valuation (Sale)': p.stockQuantity * p.sellingPrice,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Value Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=StockReport.xlsx');
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};
