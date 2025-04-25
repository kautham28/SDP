const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Function to generate next order ID in 'O0001' format
function generateNextOrderId(lastId) {
  if (!lastId) return 'O0001';
  const numeric = parseInt(lastId.slice(1)) + 1;
  return 'O' + numeric.toString().padStart(4, '0');
}

// Fetch all pending orders with status 'pending'
router.get('/pending-orders', (req, res) => {
  const query = "SELECT * FROM pending_orders WHERE status = 'pending'";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});


// Confirm order with product details
router.post('/confirm-order', (req, res) => {
  const { pharmacy_name, rep_name, total_value, order_date, userID, products } = req.body;

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).send('Transaction error');
    }

    // Step 1: Get the last orderId
    const getLastOrderIdQuery = `SELECT orderId FROM pending_orders ORDER BY CAST(SUBSTRING(orderId, 2) AS UNSIGNED) DESC LIMIT 1`;

    db.query(getLastOrderIdQuery, (err, result) => {
      if (err) {
        console.error('Error getting last orderId:', err);
        return db.rollback(() => res.status(500).send('Error getting last orderId'));
      }

      const lastOrderId = result.length > 0 ? result[0].orderId : null;
      const newOrderId = generateNextOrderId(lastOrderId);

      // Step 2: Insert into pending_orders (auto-increment orderId)
      const pendingOrderQuery = `
        INSERT INTO pending_orders (orderId, pharmacy_name, rep_name, total_value, order_date, UserID)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(pendingOrderQuery, [newOrderId, pharmacy_name, rep_name, total_value, order_date, userID], (err, result) => {
        if (err) {
          console.error('Error inserting into pending_orders:', err);
          return db.rollback(() => res.status(500).send('Error inserting pending order'));
        }

        // Step 3: Insert into order_details (auto-increment detailId)
        const detailQuery = `
          INSERT INTO order_details (orderId, product_name, unit_price, quantity, total_price)
          VALUES ?
        `;

        const detailValues = products.map(prod => [
          newOrderId,
          prod.product_name,
          prod.unit_price,
          prod.quantity,
          prod.total_price
        ]);

        db.query(detailQuery, [detailValues], (err, result) => {
          if (err) {
            console.error('Error inserting into order_details:', err);
            return db.rollback(() => res.status(500).send('Error inserting order details'));
          }

          db.commit(err => {
            if (err) {
              console.error('Commit error:', err);
              return db.rollback(() => res.status(500).send('Error committing transaction'));
            }

            res.status(200).json({ message: 'Order confirmed successfully', orderId: newOrderId });
          });
        });
      });
    });
  });
});

// Delete pending order by ID
router.delete('/pending-orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const query = 'DELETE FROM pending_orders WHERE orderId = ?';

  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Error deleting order:', err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Order not found');
    }

    res.status(200).send('Order deleted successfully');
  });
});

// Updated route to preserve UserID when confirming an order
router.put('/pending-orders/confirm/:orderId', (req, res) => {
  const { orderId } = req.params;

  // 1. Insert into confirmed_order (including UserID)
  const insertQuery = `
    INSERT INTO confirmed_order (OrderID, PharmacyName, RepName, TotalValue, OrderDate, ConfirmedDate, UserID)
    SELECT orderId, pharmacy_name, rep_name, total_value, order_date, CURDATE(), UserID
    FROM pending_orders WHERE orderId = ?
  `;

  db.query(insertQuery, [orderId], (err, result) => {
    if (err) {
      console.error('Error inserting into confirmed_order:', err);
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Order not found in pending orders');
    }

    // 2. Update the status to 'confirmed'
    const updateStatusQuery = `
      UPDATE pending_orders SET status = 'confirmed' WHERE orderId = ?
    `;

    db.query(updateStatusQuery, [orderId], (err, updateResult) => {
      if (err) {
        console.error('Error updating order status:', err);
        return res.status(500).send('Server error');
      }

      res.status(200).send('Order confirmed, inserted into confirmed orders, and marked as confirmed in pending orders');
    });
  });
});

module.exports = router;