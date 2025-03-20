const Sale = require("../models/Sale");
const User = require("../models/User");

exports.getError = async (req, res) => {
    res.render('error'); // Ensure 'error' template exists in 'views'
}

exports.getFavorite = async (req, res) => {
    // Empty implementation for future use
}

exports.getDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Get total sales for today
        const totalSalesResult = await Sale.aggregate([
            { $match: { createdAt: { $gte: today }, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;

        // Get total sales for the current month
        const monthlySalesResult = await Sale.aggregate([
            { $match: { createdAt: { $gte: firstDayOfMonth }, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const monthlySales = monthlySalesResult.length > 0 ? monthlySalesResult[0].total : 0;

        // Get daily sales for the month
        const dailySalesResult = await Sale.aggregate([
            { $match: { createdAt: { $gte: firstDayOfMonth }, status: "completed" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format data for bar chart
        const salesData = {};
        dailySalesResult.forEach(item => {
            salesData[item._id] = item.total;
        });

        // Get count of sales by status for pie chart
        const statusCountsResult = await Sale.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Format status counts for pie chart
        const statusData = { completed: 0, returned: 0, cancelled: 0 };
        statusCountsResult.forEach(item => {
            if (statusData.hasOwnProperty(item._id)) {
                statusData[item._id] = item.count;
            }
        });
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

        // Get total sales for the current year
        const yearlySalesResult = await Sale.aggregate([
            { $match: { createdAt: { $gte: firstDayOfYear }, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const yearlySales = yearlySalesResult.length > 0 ? yearlySalesResult[0].total : 0;
        // Merge status data into salesData for the template
        Object.assign(salesData, statusData);

        // Get users (excluding admins)
        const users = await User.find({ role: { $ne: "admin" } });

        res.render('admin_dashboard', {
            totalSales,
            monthlySales,
            salesData,
            users,
            yearlySales
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).send("Internal Server Error");
    }
};