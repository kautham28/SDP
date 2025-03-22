const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Fetch all pending orders
router.get('/pending-orders', (req, res) => {
  const query = 'SELECT * FROM pending_orders';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server error');
      return;
    }
    res.json(results);
  });
});

// Delete order by ID
router.delete('/pending-orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const query = 'DELETE FROM pending_orders WHERE OrderID = ?';
  
  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Error deleting order:', err);
      res.status(500).send('Server error');
      return;
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send('Order not found');
    }

    res.status(200).send('Order deleted successfully');
  });
});

// Confirm an order by ID
router.put('/pending-orders/confirm/:orderId', (req, res) => {
  const { orderId } = req.params;

  // Insert the order into the confirmed_order table
  const query = `
    INSERT INTO confirmed_order (OrderID, PharmacyName, RepName, TotalValue, OrderDate, ConfirmedDate)
    SELECT OrderID, pharmacy_name, rep_name, total_value, order_date, CURDATE()
    FROM pending_orders WHERE OrderID = ?;
  `;

  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Error confirming order:', err);
      res.status(500).send('Server error');
      return;
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Order not found in pending orders');
    }

    // After confirming, delete the order from the pending_orders table
    const deleteQuery = 'DELETE FROM pending_orders WHERE OrderID = ?';
    db.query(deleteQuery, [orderId], (err, deleteResult) => {
      if (err) {
        console.error('Error deleting confirmed order from pending:', err);
        res.status(500).send('Server error');
        return;
      }

      res.status(200).send('Order confirmed and moved to confirmed orders');
    });
  });
});

module.exports = router;
