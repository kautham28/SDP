const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/pharmacy-sales-report
router.get('/pharmacy-sales-report', (req, res) => {
  const { startDate, endDate, pharmacy_name } = req.query;

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

  // Base SQL query for summary
  let summarySQL = `
    SELECT 
      pharmacy_name,
      COUNT(*) as totalOrders,
      SUM(total_value) as totalSales,
      AVG(total_value) as avgOrderValue,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmedOrders
    FROM pending_orders
  `;
  const summaryParams = [];

  // Base SQL query for details
  let detailsSQL = `
    SELECT 
      pharmacy_name,
      orderId,
      rep_name,
      total_value,
      order_date,
      status,
      UserID
    FROM pending_orders
  `;
  const detailsParams = [];

  // Add WHERE clauses for filtering
  const conditions = [];
  if (startDate && endDate) {
    conditions.push(`order_date BETWEEN ? AND ?`);
    summaryParams.push(startDate, endDate);
    detailsParams.push(startDate, endDate);
  }
  if (pharmacy_name) {
    conditions.push(`pharmacy_name = ?`);
    summaryParams.push(pharmacy_name);
    detailsParams.push(pharmacy_name);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`;
    summarySQL += whereClause;
    detailsSQL += whereClause;
  }

  // Group and order for summary
  summarySQL += ` GROUP BY pharmacy_name ORDER BY totalSales DESC`;

  // Order for details
  detailsSQL += ` ORDER BY pharmacy_name, order_date DESC`;

  console.log('Executing summary SQL:', summarySQL, 'with params:', summaryParams);
  console.log('Executing details SQL:', detailsSQL, 'with params:', detailsParams);

  // Execute summary query
  db.query(summarySQL, summaryParams, (summaryErr, summaryResults) => {
    if (summaryErr) {
      console.error('Error fetching summary:', summaryErr.message, 'SQL:', summarySQL, 'Params:', summaryParams);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pharmacy sales report summary',
        error: summaryErr.message
      });
    }

    // Execute details query
    db.query(detailsSQL, detailsParams, (detailsErr, detailsResults) => {
      if (detailsErr) {
        console.error('Error fetching details:', detailsErr.message, 'SQL:', detailsSQL, 'Params:', detailsParams);
        return res.status(500).json({
          success: false,
          message: 'Error fetching pharmacy sales report details',
          error: detailsErr.message
        });
      }

      // Process summary data
      const summaryData = summaryResults.map(row => ({
        pharmacy_name: row.pharmacy_name,
        totalOrders: row.totalOrders,
        totalSales: parseFloat(row.totalSales).toFixed(2),
        avgOrderValue: parseFloat(row.avgOrderValue).toFixed(2),
        confirmedPercentage: row.totalOrders > 0 
          ? ((row.confirmedOrders / row.totalOrders) * 100).toFixed(2) + '%' 
          : '0.00%'
      }));

      // Process details data
      const detailsData = detailsResults.map(row => ({
        pharmacy_name: row.pharmacy_name,
        orderId: row.orderId,
        repName: row.rep_name,
        totalValue: parseFloat(row.total_value).toFixed(2),
        orderDate: row.order_date instanceof Date 
          ? row.order_date.toISOString().split('T')[0] 
          : row.order_date,
        status: row.status,
        userId: row.UserID
      }));

      // Response
      res.json({
        success: true,
        data: {
          summary: summaryData,
          details: detailsData
        }
      });
    });
  });
});

module.exports = router;