const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get dashboard metrics & analytics (100% Dynamic & NeDB/Mongo Compatible)
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    // Fetch all records for this tenant
    const allInvoices = await Invoice.find({ tenantId });
    const allProducts = await Product.find({ tenantId });
    const allCustomers = await Customer.find({ tenantId });

    // Date references
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Calculate Real Dynamic Sales Metrics
    let totalSales = 0;
    let todaySales = 0;
    let monthlySales = 0;
    let pendingPayments = 0;

    for (const inv of allInvoices) {
      const grandTotal = Number(inv.grandTotal) || 0;
      const balance = Number(inv.balanceAmount) || 0;
      const invDate = new Date(inv.createdAt);

      totalSales += grandTotal;
      pendingPayments += balance;

      if (invDate >= startOfToday) {
        todaySales += grandTotal;
      }
      if (invDate >= startOfMonth) {
        monthlySales += grandTotal;
      }
    }

    // 2. Count metrics
    const totalCustomers = allCustomers.length;
    const totalProducts = allProducts.length;

    // 3. Low stock count and products
    const lowStockAll = allProducts.filter(p => {
      const stock = Number(p.stockQuantity) || 0;
      const minStock = Number(p.minStockLevel !== undefined ? p.minStockLevel : 5);
      return stock <= minStock;
    });
    const lowStockCount = lowStockAll.length;
    const lowStockProducts = lowStockAll.slice(0, 5);

    // 4. Map Customer Names for Recent Transactions
    const customerMap = {};
    for (const c of allCustomers) {
      customerMap[c._id.toString()] = c;
    }

    const recentTransactions = allInvoices
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(inv => {
        const custId = inv.customer ? (inv.customer._id || inv.customer).toString() : null;
        const custObj = custId && customerMap[custId] ? {
          _id: customerMap[custId]._id,
          name: customerMap[custId].name,
          phone: customerMap[custId].phone
        } : { name: 'Walk-in Consumer' };

        return {
          ...inv,
          customer: custObj
        };
      });

    // 5. Top Selling Products (Aggregated in JS)
    const productSalesMap = {};
    for (const inv of allInvoices) {
      if (Array.isArray(inv.items)) {
        for (const item of inv.items) {
          const pId = item.product ? (item.product._id || item.product).toString() : item.name;
          if (!productSalesMap[pId]) {
            productSalesMap[pId] = {
              _id: pId,
              name: item.name || 'Unnamed Item',
              quantitySold: 0,
              revenue: 0
            };
          }
          productSalesMap[pId].quantitySold += Number(item.quantity) || 1;
          productSalesMap[pId].revenue += Number(item.total) || 0;
        }
      }
    }
    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // 6. Real Sales Timeline (7d, 30d, 12m)
    const timeframe = req.query.timeframe || '7d';
    const chartData = [];
    const now = new Date();

    if (timeframe === '12m') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;

        const monthInvoices = allInvoices.filter(inv => {
          const dt = new Date(inv.createdAt);
          return dt.getFullYear() === yyyy && dt.getMonth() === d.getMonth();
        });

        const sales = monthInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
        chartData.push({
          _id: key,
          sales: parseFloat(sales.toFixed(2)),
          transactions: monthInvoices.length,
          realSales: parseFloat(sales.toFixed(2))
        });
      }
    } else if (timeframe === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        const dayInvoices = allInvoices.filter(inv => {
          const dt = new Date(inv.createdAt);
          return dt.getFullYear() === yyyy && (dt.getMonth() + 1) === Number(mm) && dt.getDate() === Number(dd);
        });

        const sales = dayInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
        chartData.push({
          _id: key,
          sales: parseFloat(sales.toFixed(2)),
          transactions: dayInvoices.length,
          realSales: parseFloat(sales.toFixed(2))
        });
      }
    } else {
      // 7 Days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        const dayInvoices = allInvoices.filter(inv => {
          const dt = new Date(inv.createdAt);
          return dt.getFullYear() === yyyy && (dt.getMonth() + 1) === Number(mm) && dt.getDate() === Number(dd);
        });

        const sales = dayInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
        chartData.push({
          _id: key,
          sales: parseFloat(sales.toFixed(2)),
          transactions: dayInvoices.length,
          realSales: parseFloat(sales.toFixed(2))
        });
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        todaySales: parseFloat(todaySales.toFixed(2)),
        monthlySales: parseFloat(monthlySales.toFixed(2)),
        pendingPayments: parseFloat(pendingPayments.toFixed(2)),
        totalCustomers,
        totalProducts,
        lowStockCount,
        topSellingProducts,
        lowStockProducts,
      },
      recentTransactions,
      chartData,
    });
  } catch (error) {
    next(error);
  }
};
