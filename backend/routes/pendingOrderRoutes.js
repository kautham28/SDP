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

// Helper function to get month name from date
function getMonthName(date) {
  return date.toLocaleString('en-US', { month: 'long' });
}

// Fetch all pending orders with status 'pending'
router.get('/pending-orders', (req, res) => {
  const query = "SELECT * FROM pending_orders WHERE status = 'pending'";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
    res.json(results);
  });
});

// Confirm order with product details and reduce product quantity
router.post('/confirm-order', (req, res) => {
  const { pharmacy_name, rep_name, total_value, order_date, userID, products } = req.body;

  // Validate input
  if (!pharmacy_name || !rep_name || !total_value || !order_date || !userID || !products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ error: 'Transaction error', details: err.message });
    }

    // Step 1: Get the last orderId
    const getLastOrderIdQuery = `SELECT orderId FROM pending_orders ORDER BY CAST(SUBSTRING(orderId, 2) AS UNSIGNED) DESC LIMIT 1`;

    db.query(getLastOrderIdQuery, (err, result) => {
      if (err) {
        console.error('Error getting last orderId:', err);
        return db.rollback(() => res.status(500).json({ error: 'Error getting last orderId', details: err.message }));
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
          return db.rollback(() => res.status(500).json({ error: 'Error inserting pending order', details: err.message }));
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
            return db.rollback(() => res.status(500).json({ error: 'Error inserting order details', details: err.message }));
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
                  return db.rollback(() => res.status(500).json({ error: 'Error committing transaction', details: err.message }));
                }
                res.status(200).json({ message: 'Order confirmed and stock updated', orderId: newOrderId });
              });
            })
            .catch(err => {
              console.error('Error updating product stock:', err);
              db.rollback(() => res.status(500).json({ error: 'Error updating product stock', details: err.message }));
            });
        });
      });
    });
  });
});

// Delete pending order and restore product quantities
router.delete('/pending-orders/:orderId', (req, res) => {
  const { orderId } = req.params;

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ error: 'Transaction error', details: err.message });
    }

    // Step 1: Get order details
    const getDetailsQuery = `SELECT product_name, quantity FROM order_details WHERE orderId = ?`;
    db.query(getDetailsQuery, [orderId], (err, orderDetails) => {
      if (err) {
        console.error('Error fetching order details:', err);
        return db.rollback(() => res.status(500).json({ error: 'Error fetching order details', details: err.message }));
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
              return db.rollback(() => res.status(500).json({ error: 'Error deleting order details', details: err.message }));
            }

            // Step 5: Delete the pending order
            const deleteOrderQuery = `DELETE FROM pending_orders WHERE orderId = ?`;
            db.query(deleteOrderQuery, [orderId], (err, result) => {
              if (err) {
                console.error('Error deleting order:', err);
                return db.rollback(() => res.status(500).json({ error: 'Error deleting order', details: err.message }));
              }

              if (result.affectedRows === 0) {
                return db.rollback(() => res.status(404).json({ error: 'Order not found' }));
              }

              db.commit(err => {
                if (err) {
                  console.error('Commit error:', err);
                  return db.rollback(() => res.status(500).json({ error: 'Commit error', details: err.message }));
                }

                res.status(200).json({ message: 'Order deleted and stock restored successfully' });
              });
            });
          });
        })
        .catch(err => {
          console.error('Error restoring stock:', err);
          db.rollback(() => res.status(500).json({ error: 'Error restoring stock', details: err.message }));
        });
    });
  });
});

// Confirm order, move to confirmed_order, update rep_achievements, and mark as confirmed
router.put('/pending-orders/confirm/:orderId', (req, res) => {
  const { orderId } = req.params;

  db.beginTransaction(err => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ error: 'Transaction error', details: err.message });
    }

    // Step 1: Fetch order details
    const fetchOrderQuery = `
      SELECT UserID, total_value, order_date
      FROM pending_orders
      WHERE orderId = ?
    `;
    db.query(fetchOrderQuery, [orderId], (err, orderResult) => {
      if (err) {
        console.error('Error fetching order:', err);
        return db.rollback(() => res.status(500).json({ error: 'Failed to fetch order', details: err.message }));
      }

      if (orderResult.length === 0) {
        return db.rollback(() => res.status(404).json({ error: 'Order not found' }));
      }

      const { UserID, total_value, order_date } = orderResult[0];
      const orderDate = new Date(order_date);
      const month = getMonthName(orderDate);
      const year = orderDate.getFullYear();

      // Step 2: Insert into confirmed_order
      const insertQuery = `
        INSERT INTO confirmed_order (OrderID, PharmacyName, RepName, TotalValue, OrderDate, ConfirmedDate, UserID)
        SELECT orderId, pharmacy_name, rep_name, total_value, order_date, CURDATE(), UserID
        FROM pending_orders
        WHERE orderId = ?
      `;
      db.query(insertQuery, [orderId], (err, result) => {
        if (err) {
          console.error('Error inserting into confirmed_order:', err);
          return db.rollback(() => res.status(500).json({ error: 'Failed to confirm order', details: err.message }));
        }

        if (result.affectedRows === 0) {
          return db.rollback(() => res.status(404).json({ error: 'Order not found in pending orders' }));
        }

        // Step 3: Update rep_achievements
        const checkAchievementQuery = `
          SELECT TotalSales, Target
          FROM rep_achievements
          WHERE RepID = ? AND Month = ? AND Year = ?
        `;
        db.query(checkAchievementQuery, [UserID, month, year], (err, achievementResult) => {
          if (err) {
            console.error('Error checking rep_achievements:', err);
            return db.rollback(() => res.status(500).json({ error: 'Failed to check achievements', details: err.message }));
          }

          if (achievementResult.length > 0) {
            // Update existing record
            const { TotalSales, Target } = achievementResult[0];
            const newTotalSales = parseFloat(TotalSales) + parseFloat(total_value);
            const newPercentage = Target > 0 ? (newTotalSales / Target) * 100 : 0;

            const updateAchievementQuery = `
              UPDATE rep_achievements
              SET TotalSales = ?, percentage = ?, LastUpdated = CURRENT_TIMESTAMP
              WHERE RepID = ? AND Month = ? AND Year = ?
            `;
            db.query(updateAchievementQuery, [newTotalSales, newPercentage, UserID, month, year], (err) => {
              if (err) {
                console.error('Error updating rep_achievements:', err);
                return db.rollback(() => res.status(500).json({ error: 'Failed to update achievements', details: err.message }));
              }
              proceedToUpdateStatus();
            });
          } else {
            // Insert new record
            const newTotalSales = parseFloat(total_value);
            const defaultTarget = 0.00; // Adjust if you have a default target
            const newPercentage = defaultTarget > 0 ? (newTotalSales / defaultTarget) * 100 : 0;

            const insertAchievementQuery = `
              INSERT INTO rep_achievements (RepID, Month, Year, Target, TotalSales, percentage)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            db.query(insertAchievementQuery, [UserID, month, year, defaultTarget, newTotalSales, newPercentage], (err) => {
              if (err) {
                console.error('Error inserting into rep_achievements:', err);
                return db.rollback(() => res.status(500).json({ error: 'Failed to insert achievements', details: err.message }));
              }
              proceedToUpdateStatus();
            });
          }
        });

        // Step 4: Update pending_orders status
        function proceedToUpdateStatus() {
          const updateStatusQuery = `
            UPDATE pending_orders
            SET status = 'confirmed'
            WHERE orderId = ?
          `;
          db.query(updateStatusQuery, [orderId], (err, updateResult) => {
            if (err) {
              console.error('Error updating order status:', err);
              return db.rollback(() => res.status(500).json({ error: 'Failed to update order status', details: err.message }));
            }

            db.commit(err => {
              if (err) {
                console.error('Commit error:', err);
                return db.rollback(() => res.status(500).json({ error: 'Commit error', details: err.message }));
              }
              res.status(200).json({ message: 'Order confirmed, achievements updated, and marked as confirmed in pending orders' });
            });
          });
        }
      });
    });
  });
});

module.exports = router;