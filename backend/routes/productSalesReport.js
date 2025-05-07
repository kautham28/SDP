const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/product-sales-report
router.get('/product-sales-report', (req, res) => {
  const { startDate, endDate, productName, pharmacyName, repName } = req.query;

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

  // Query 1: Product-wise Sales Summary
  let productSql = `
    SELECT 
      od.product_name,
      COALESCE(SUM(od.quantity), 0) as totalQuantity,
      COALESCE(SUM(od.total_price), 0) as totalSalesValue,
      COALESCE(AVG(od.unit_price), 0) as avgUnitPrice,
      COUNT(DISTINCT od.orderId) as orderCount,
      GROUP_CONCAT(DISTINCT co.PharmacyName) as pharmacies
    FROM order_details od
    LEFT JOIN confirmed_order co ON od.orderId = co.OrderID
    WHERE 1=1
  `;
  const productParams = [];

  if (startDate && endDate) {
    productSql += ` AND co.OrderDate BETWEEN ? AND ?`;
    productParams.push(startDate, endDate);
  }
  if (productName) {
    productSql += ` AND od.product_name LIKE ?`;
    productParams.push(`%${productName}%`);
  }
  if (pharmacyName) {
    productSql += ` AND co.PharmacyName LIKE ?`;
    productParams.push(`%${pharmacyName}%`);
  }
  if (repName) {
    productSql += ` AND co.RepName LIKE ?`;
    productParams.push(`%${repName}%`);
  }

  productSql += ` GROUP BY od.product_name
                  ORDER BY totalSalesValue DESC`;

  // Query 2: Rep-wise Product Sales Summary
  let repSql = `
    SELECT 
      co.RepName as repName,
      od.product_name,
      COALESCE(SUM(od.quantity), 0) as totalQuantity,
      COALESCE(SUM(od.total_price), 0) as totalSalesValue
    FROM order_details od
    LEFT JOIN confirmed_order co ON od.orderId = co.OrderID
    WHERE 1=1
  `;
  const repParams = [];

  if (startDate && endDate) {
    repSql += ` AND co.OrderDate BETWEEN ? AND ?`;
    repParams.push(startDate, endDate);
  }
  if (productName) {
    repSql += ` AND od.product_name LIKE ?`;
    repParams.push(`%${productName}%`);
  }
  if (pharmacyName) {
    repSql += ` AND co.PharmacyName LIKE ?`;
    repParams.push(`%${pharmacyName}%`);
  }
  if (repName) {
    repSql += ` AND co.RepName LIKE ?`;
    repParams.push(`%${repName}%`);
  }

  repSql += ` GROUP BY co.RepName, od.product_name
              ORDER BY co.RepName, totalSalesValue DESC`;

  // Execute queries
  console.log('Executing Product SQL:', productSql, 'with params:', productParams); // Debug log
  db.query(productSql, productParams, (err, productResults) => {
    if (err) {
      console.error('Error fetching product sales report:', err.message, 'SQL:', productSql, 'Params:', productParams);
      return res.status(500).json({
        success: false,
        message: 'Error fetching product sales report',
        error: err.message
      });
    }

    console.log('Product Results:', productResults); // Debug log
    console.log('Executing Rep SQL:', repSql, 'with params:', repParams); // Debug log
    db.query(repSql, repParams, (err, repResults) => {
      if (err) {
        console.error('Error fetching rep-wise product sales:', err.message, 'SQL:', repSql, 'Params:', repParams);
        return res.status(500).json({
          success: false,
          message: 'Error fetching rep-wise product sales',
          error: err.message
        });
      }

      console.log('Rep Results:', repResults); // Debug log

      // Process Product-wise Sales Results
      const productData = productResults.map(row => ({
        productName: row.product_name,
        totalQuantity: row.totalQuantity,
        totalSalesValue: parseFloat(row.totalSalesValue).toFixed(2),
        avgUnitPrice: parseFloat(row.avgUnitPrice).toFixed(2),
        orderCount: row.orderCount,
        pharmacies: row.pharmacies ? row.pharmacies.split(',') : []
      }));

      // Process Rep-wise Product Sales Results
      const repData = repResults.map(row => ({
        repName: row.repName,
        productName: row.product_name,
        totalQuantity: row.totalQuantity,
        totalSalesValue: parseFloat(row.totalSalesValue).toFixed(2)
      }));

      res.json({
        success: true,
        data: {
          productSummary: productData,
          repProductSummary: repData
        }
      });
    }); // Closing brace for the second db.query callback
  }); // Closing brace for the first db.query callback
});

module.exports = router;