const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/order-report/summary (Route for Order Report Summary - pending_orders Table)
router.get('/order-report/summary', (req, res) => {
    const { startDate, endDate } = req.query;

    // Validate date format if provided
    if (startDate && endDate) {
        const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormat.test(startDate) || !dateFormat.test(endDate)) {
            console.error('Invalid date format:', { startDate, endDate });
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD.',
                error: 'Invalid date format'
            });
        }

        // Validate date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            console.error('Start date is after end date:', { startDate, endDate });
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date.',
                error: 'Invalid date range'
            });
        }
    }

    // Base SQL query
    let ordersSQL = `
        SELECT 
            status,
            total_value
        FROM pending_orders
    `;

    const params = [];

    // Add date filter if provided
    if (startDate && endDate) {
        ordersSQL += ` WHERE order_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    console.log('Executing SQL query for summary:', ordersSQL, 'with params:', params);

    db.query(ordersSQL, params, (err, orders) => {
        if (err) {
            console.error('Error fetching orders for summary:', err.message, 'SQL:', ordersSQL, 'Params:', params);
            return res.status(500).json({
                success: false,
                message: 'Error fetching order report summary',
                error: err.message
            });
        }

        console.log('Fetched orders for summary:', orders.length);

        // Handle empty results
        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: startDate && endDate 
                    ? 'No orders found for the given date range.'
                    : 'No orders found.',
                data: {
                    totalOrders: 0,
                    pendingOrdersCount: 0,
                    confirmedOrdersCount: 0,
                    totalOrderValue: 0.00,
                    confirmedPercentage: "0.00%"
                }
            });
        }

        // Calculate totals
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending');
        const confirmedOrders = orders.filter(o => o.status.toLowerCase() === 'confirmed');
        const totalOrderValue = orders.reduce((sum, order) => sum + parseFloat(order.total_value || 0), 0).toFixed(2);
        const confirmedPercentage = totalOrders > 0 
            ? ((confirmedOrders.length / totalOrders) * 100).toFixed(2) 
            : 0;

        // Response object
        const summary = {
            totalOrders: totalOrders,
            pendingOrdersCount: pendingOrders.length,
            confirmedOrdersCount: confirmedOrders.length,
            totalOrderValue: parseFloat(totalOrderValue),
            confirmedPercentage: `${confirmedPercentage}%`
        };

        console.log('Sending summary response:', summary);

        res.json({
            success: true,
            data: summary
        });
    });
});

// GET /api/reports/order-report/details (Route for Order Report Details - pending_orders Table)
router.get('/order-report/details', (req, res) => {
    const { startDate, endDate } = req.query;

    // Validate date format if provided
    if (startDate && endDate) {
        const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormat.test(startDate) || !dateFormat.test(endDate)) {
            console.error('Invalid date format:', { startDate, endDate });
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD.',
                error: 'Invalid date format'
            });
        }

        // Validate date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            console.error('Start date is after end date:', { startDate, endDate });
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date.',
                error: 'Invalid date range'
            });
        }
    }

    // Base SQL query
    let ordersSQL = `
        SELECT 
            orderId,
            pharmacy_name,
            rep_name,
            total_value,
            order_date,
            UserID,
            status
        FROM pending_orders
    `;

    const params = [];

    // Add date filter if provided
    if (startDate && endDate) {
        ordersSQL += ` WHERE order_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    console.log('Executing SQL query for details:', ordersSQL, 'with params:', params);

    db.query(ordersSQL, params, (err, orders) => {
        if (err) {
            console.error('Error fetching orders for details:', err.message, 'SQL:', ordersSQL, 'Params:', params);
            return res.status(500).json({
                success: false,
                message: 'Error fetching order report details',
                error: err.message
            });
        }

        console.log('Fetched orders for details:', orders.length);

        // Handle empty results
        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: startDate && endDate 
                    ? 'No orders found for the given date range.'
                    : 'No orders found.',
                data: {
                    orders: []
                }
            });
        }

        // Response object
        const details = {
            orders: orders.map(order => ({
                orderId: order.orderId,
                pharmacyName: order.pharmacy_name,
                repName: order.rep_name,
                totalValue: parseFloat(order.total_value).toFixed(2),
                orderDate: order.order_date instanceof Date 
                    ? order.order_date.toISOString().split('T')[0] 
                    : order.order_date,
                userId: order.UserID,
                status: order.status || 'pending'
            }))
        };

        console.log('Sending details response:', { orderCount: details.orders.length });

        res.json({
            success: true,
            data: details
        });
    });
});

module.exports = router;