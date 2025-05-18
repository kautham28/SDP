const express = require('express');
const db = require('../config/db.js');

const router = express.Router();

// Fetch dashboard data
router.get('/dashboard', (req, res) => {
  console.log('Handling /api/dashboard request');

  // Query for Balance Stock
  const stockQuery = `
    SELECT COALESCE(SUM(TotalPrice), 0) AS balanceStock
    FROM products
    WHERE Status = 'Active'
  `;

  // Query for Pending Orders
  const pendingQuery = `
    SELECT COALESCE(SUM(total_value), 0) AS pendingOrders
    FROM pending_orders
    WHERE status = 'pending'
      AND YEAR(order_date) = YEAR(CURRENT_DATE)
      AND MONTH(order_date) = MONTH(CURRENT_DATE)
  `;

  // Query for Total Sales
  const salesQuery = `
    SELECT COALESCE(SUM(TotalValue), 0) AS totalSales
    FROM confirmed_order
    WHERE YEAR(OrderDate) = YEAR(CURRENT_DATE)
      AND MONTH(OrderDate) = MONTH(CURRENT_DATE)
  `;

  // Query for Number of Reps
  const repsQuery = `
    SELECT COUNT(*) AS numberOfReps
    FROM users
    WHERE role = 'Rep' AND status = 'working'
  `;

  // Query for Last 5 Months Sales (Updated to ensure 5 months)
  const monthlySalesQuery = `
    WITH months AS (
      SELECT DATE_FORMAT(DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL n MONTH), '%Y-%m') AS month
      FROM (
        SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      ) AS numbers
    )
    SELECT 
      m.month,
      COALESCE(SUM(co.TotalValue), 0) AS sales
    FROM months m
    LEFT JOIN confirmed_order co
      ON DATE_FORMAT(co.OrderDate, '%Y-%m') = m.month
      AND co.OrderDate >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)
      AND co.OrderDate <= NOW()
    GROUP BY m.month
    ORDER BY m.month DESC
    LIMIT 5
  `;

  // Query for Rep Sales Comparison
  const repSalesQuery = `
    SELECT 
      RepName,
      COALESCE(SUM(TotalValue), 0) AS sales
    FROM confirmed_order
    GROUP BY RepName
    ORDER BY sales DESC
    LIMIT 5
  `;

  db.query(stockQuery, (err, stockResults) => {
    if (err) {
      console.error('Error fetching balance stock:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    db.query(pendingQuery, (err, pendingResults) => {
      if (err) {
        console.error('Error fetching pending orders:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      db.query(salesQuery, (err, salesResults) => {
        if (err) {
          console.error('Error fetching total sales:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }
        db.query(repsQuery, (err, repsResults) => {
          if (err) {
            console.error('Error fetching number of reps:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
          }
          db.query(monthlySalesQuery, (err, monthlySalesResults) => {
            if (err) {
              console.error('Error fetching monthly sales:', err);
              return res.status(500).json({ error: 'Database error', details: err.message });
            }
            db.query(repSalesQuery, (err, repSalesResults) => {
              if (err) {
                console.error('Error fetching rep sales:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
              }

              // Format chart data
              const barChartData = {
                labels: monthlySalesResults.map(row => row.month),
                datasets: [
                  {
                    label: 'Monthly Sales',
                    data: monthlySalesResults.map(row => row.sales),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                  },
                ],
              };
              const lineChartData = {
                labels: repSalesResults.map(row => row.RepName),
                datasets: [
                  {
                    label: 'Rep Sales',
                    data: repSalesResults.map(row => row.sales),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    fill: true,
                  },
                ],
              };

              // Send response
              res.json({
                balanceStock: stockResults[0].balanceStock,
                pendingOrders: pendingResults[0].pendingOrders,
                totalSales: salesResults[0].totalSales,
                numberOfReps: repsResults[0].numberOfReps,
                barChartData,
                lineChartData,
              });
            });
          });
        });
      });
    });
  });
});

// Fetch current month rep sales
router.get('/rep-sales-current-month', (req, res) => {
  console.log('Handling /api/rep-sales-current-month request');

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const query = `
    SELECT RepID, TotalSales
    FROM rep_achievements
    WHERE Month = ? AND Year = ?
    ORDER BY RepID
  `;

  db.query(query, [currentMonth, currentYear], (err, results) => {
    if (err) {
      console.error('Error fetching current month rep sales:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(results);
  });
});

module.exports = router;