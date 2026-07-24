const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get dashboard metrics & analytics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // 1. Total & Today's Sales & Monthly Revenue Aggregation
    const salesStats = await Invoice.aggregate([
      {
        $facet: {
          totalSales: [
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ],
          todaySales: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ],
          monthlySales: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' } } }
          ],
          pendingPayments: [
            { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
          ]
        }
      }
    ]);

    const totalSales = salesStats[0].totalSales[0]?.total || 0;
    const todaySales = salesStats[0].todaySales[0]?.total || 0;
    const monthlySales = salesStats[0].monthlySales[0]?.total || 0;
    const pendingPayments = salesStats[0].pendingPayments[0]?.total || 0;

    // 2. Count metrics
    const totalCustomers = await Customer.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // 3. Low stock count
    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    });

    // 4. Recent transactions
    const recentTransactions = await Invoice.find()
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Sales chart data (last 7 days daily totals)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyChartData = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$grandTotal' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalSales,
        todaySales,
        monthlySales,
        pendingPayments,
        totalCustomers,
        totalProducts,
        lowStockCount,
      },
      recentTransactions,
      chartData: dailyChartData,
    });
  } catch (error) {
    next(error);
  }
};
