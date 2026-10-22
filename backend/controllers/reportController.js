const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const XLSX = require('xlsx');

// @desc    Get GST/Tax summary reports
// @route   GET /api/reports/gst
// @access  Private
exports.getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';
    const match = { tenantId: tenantIdToUse };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    const invoices = await Invoice.find(match);
    const taxMap = {};

    invoices.forEach((inv) => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const rate = item.gstPercentage !== undefined ? item.gstPercentage : 18;
          if (!taxMap[rate]) {
            taxMap[rate] = {
              _id: rate,
              taxableValue: 0,
              cgst: 0,
              sgst: 0,
              igst: 0,
              totalTax: 0,
            };
          }
          const itemTaxable = ((item.unitPrice || 0) * (item.quantity || 1)) - (item.discountAmount || 0);
          taxMap[rate].taxableValue += (itemTaxable || 0);
          taxMap[rate].cgst += (item.cgst || 0);
          taxMap[rate].sgst += (item.sgst || 0);
          taxMap[rate].igst += (item.igst || 0);
          taxMap[rate].totalTax += ((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0));
        });
      }
    });

    const taxSummary = Object.values(taxMap).sort((a, b) => a._id - b._id);
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
    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';
    const matchQuery = { tenantId: tenantIdToUse };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    const invoices = await Invoice.find(matchQuery);

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalDiscountGiven = 0;

    invoices.forEach((inv) => {
      totalRevenue += (inv.grandTotal || 0);
      totalDiscountGiven += (inv.totalDiscount || 0);
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          totalCogs += ((item.quantity || 1) * (item.purchasePrice || 0));
        });
      }
    });

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit;

    res.status(200).json({
      success: true,
      report: {
        totalRevenue: totalRevenue || 0,
        totalCogs: totalCogs || 0,
        totalDiscountGiven: totalDiscountGiven || 0,
        grossProfit: grossProfit || 0,
        netProfit: netProfit || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear old test invoices
// @route   DELETE /api/reports/clear-old
// @access  Private (Admin only)
exports.clearOldReports = async (req, res, next) => {
  try {
    const tenantIdToUse = (req.user && req.user.tenantId) || '6aae231ec9df40fedcdd4170';
    // Remove invoices before today (2026-10-22)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deleted = await Invoice.deleteMany({
      tenantId: tenantIdToUse,
      createdAt: { $lt: today },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Old reports and dummy test invoices removed successfully', 
      deletedCount: deleted 
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
