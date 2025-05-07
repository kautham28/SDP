const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/expiry-goods-report
router.get('/expiry-goods-report', (req, res) => {
  const { startDate, endDate, supplierName } = req.query;

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
      ProductID,
      Name,
      BatchNumber,
      ExpiryDate,
      Quantity,
      UnitPrice,
      TotalPrice,
      SupplierName,
      DATEDIFF(ExpiryDate, CURDATE()) as daysUntilExpiry
    FROM products
  `;
  const params = [];

  // Add WHERE clauses for filtering
  const conditions = [];
  if (startDate && endDate) {
    conditions.push(`ExpiryDate BETWEEN ? AND ?`);
    params.push(startDate, endDate);
  }
  if (supplierName) {
    conditions.push(`SupplierName = ?`);
    params.push(supplierName);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`;
    sql += whereClause;
  }

  // Order by expiry date
  sql += ` ORDER BY ExpiryDate ASC`;

  console.log('Executing SQL:', sql, 'with params:', params);

  // Execute query
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching expiry goods report:', err.message, 'SQL:', sql, 'Params:', params);
      return res.status(500).json({
        success: false,
        message: 'Error fetching expiry goods report',
        error: err.message
      });
    }

    // Process results
    const reportData = results.map(row => ({
      productId: row.ProductID,
      name: row.Name,
      batchNumber: row.BatchNumber,
      expiryDate: row.ExpiryDate instanceof Date 
        ? row.ExpiryDate.toISOString().split('T')[0] 
        : row.ExpiryDate,
      quantity: row.Quantity,
      unitPrice: parseFloat(row.UnitPrice).toFixed(2),
      totalPrice: parseFloat(row.TotalPrice).toFixed(2),
      supplierName: row.SupplierName || 'N/A',
      daysUntilExpiry: row.daysUntilExpiry,
      status: row.daysUntilExpiry < 0 ? 'Expired' : 
              row.daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Valid'
    }));

    res.json({
      success: true,
      data: reportData
    });
  });
});

module.exports = router;