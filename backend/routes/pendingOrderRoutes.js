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


// Confirm order with product details and reduce product quantity
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

      // Step 2: Insert into pending_orders
      const pendingOrderQuery = `
        INSERT INTO pending_orders (orderId, pharmacy_name, rep_name, total_value, order_date, UserID)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(pendingOrderQuery, [newOrderId, pharmacy_name, rep_name, total_value, order_date, userID], (err, result) => {
        if (err) {
          console.error('Error inserting into pending_orders:', err);
          return db.rollback(() => res.status(500).send('Error inserting pending order'));
        }

        // Step 3: Insert into order_details
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

          // Step 4: Reduce product quantity in products table
          const updateStockTasks = products.map(prod => {
            return new Promise((resolve, reject) => {
              const updateQuery = `
                UPDATE products
                SET Quantity = Quantity - ?
                WHERE Name = ?
              `;
              db.query(updateQuery, [prod.quantity, prod.product_name], (err, result) => {
                if (err) {
                  return reject(err);
                }
                resolve();
              });
            });
          });

          // Step 5: Commit after all updates
          Promise.all(updateStockTasks)
            .then(() => {
              db.commit(err => {
                if (err) {
                  console.error('Commit error:', err);
                  return db.rollback(() => res.status(500).send('Error committing transaction'));
                }
                res.status(200).json({ message: 'Order confirmed and stock updated', orderId: newOrderId });
              });
            })
            .catch(err => {
              console.error('Error updating product stock:', err);
              db.rollback(() => res.status(500).send('Error updating product stock'));
            });
        });
      });
    });
  });
});


router.delete('/pending-orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).send('Transaction error');
    }

    // Step 1: Get order details
    const getDetailsQuery = `SELECT product_name, quantity FROM order_details WHERE orderId = ?`;
    db.query(getDetailsQuery, [orderId], (err, orderDetails) => {
      if (err) {
        console.error('Error fetching order details:', err);
        return db.rollback(() => res.status(500).send('Error fetching order details'));
      }

      // Step 2: Restore product quantities
      const restoreTasks = orderDetails.map(detail => {
        return new Promise((resolve, reject) => {
          const updateQuery = `
            UPDATE products
            SET Quantity = Quantity + ?
            WHERE Name = ?
          `;
          db.query(updateQuery, [detail.quantity, detail.product_name], (err, result) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });

      // Step 3: Proceed after restoring stock
      Promise.all(restoreTasks)
        .then(() => {
          // Step 4: Delete order details
          const deleteDetailsQuery = `DELETE FROM order_details WHERE orderId = ?`;
          db.query(deleteDetailsQuery, [orderId], (err, result) => {
            if (err) {
              console.error('Error deleting order details:', err);
              return db.rollback(() => res.status(500).send('Error deleting order details'));
            }

            // Step 5: Delete the pending order
            const deleteOrderQuery = `DELETE FROM pending_orders WHERE orderId = ?`;
            db.query(deleteOrderQuery, [orderId], (err, result) => {
              if (err) {
                console.error('Error deleting order:', err);
                return db.rollback(() => res.status(500).send('Error deleting order'));
              }

              if (result.affectedRows === 0) {
                return db.rollback(() => res.status(404).send('Order not found'));
              }

              db.commit(err => {
                if (err) {
                  console.error('Commit error:', err);
                  return db.rollback(() => res.status(500).send('Commit error'));
                }

                res.status(200).send('Order deleted and stock restored successfully');
              });
            });
          });
        })
        .catch(err => {
          console.error('Error restoring stock:', err);
          db.rollback(() => res.status(500).send('Error restoring stock'));
        });
    });
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