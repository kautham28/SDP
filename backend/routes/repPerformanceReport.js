const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/rep-performance-report
router.get('/rep-performance-report', (req, res) => {
  const { repId, month, year, startDate, endDate } = req.query;

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
  let sql = `
    SELECT 
      ra.RepID,
      ra.Month,
      ra.Year,
      ra.Target,
      ra.TotalSales,
      ra.Percentage,
      COALESCE(SUM(co.TotalValue), 0) as confirmedSales,
      (ra.TotalSales - COALESCE(SUM(co.TotalValue), 0)) as salesDifference
    FROM rep_achievements ra
    LEFT JOIN confirmed_order co ON ra.RepID = co.UserID AND co.OrderDate BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()
    WHERE 1=1
  `;
  const params = [];

  // Add WHERE clauses for filtering
  if (repId) {
    sql += ` AND ra.RepID = ?`;
    params.push(repId);
  }
  if (month) {
    sql += ` AND ra.Month = ?`;
    params.push(month);
  }
  if (year) {
    sql += ` AND ra.Year = ?`;
    params.push(year);
  }
  if (startDate && endDate) {
    sql += ` AND co.OrderDate BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  sql += ` GROUP BY ra.RepID, ra.Month, ra.Year, ra.Target, ra.TotalSales, ra.Percentage
           ORDER BY ra.Year DESC, ra.Month DESC, ra.TotalSales DESC`;

  console.log('Executing SQL:', sql, 'with params:', params);

  // Execute query
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching rep performance report:', err.message, 'SQL:', sql, 'Params:', params);
      return res.status(500).json({
        success: false,
        message: 'Error fetching rep performance report',
        error: err.message
      });
    }

    // Process results
    const reportData = results.map(row => ({
      repId: row.RepID,
      month: row.Month,
      year: row.Year,
      target: parseFloat(row.Target).toFixed(2),
      totalSales: parseFloat(row.TotalSales).toFixed(2),
      percentage: parseFloat(row.Percentage).toFixed(2) + '%',
      confirmedSales: parseFloat(row.confirmedSales).toFixed(2),
      salesDifference: parseFloat(row.salesDifference).toFixed(2)
    }));

    res.json({
      success: true,
      data: reportData
    });
  });
});

module.exports = router;