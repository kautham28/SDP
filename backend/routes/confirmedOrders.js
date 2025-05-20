const express = require('express');
const router = express.Router();
const db = require('../config/db.js'); // Import your MySQL database connection

// Get all confirmed orders
router.get('/confirmed-orders', (req, res) => {
    const query = "SELECT * FROM confirmed_order ORDER BY ConfirmedDate DESC";
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
});

// Get confirmed orders for a specific Rep
router.get('/confirmed-orders/:repID', (req, res) => {
    const repID = req.params.repID;
    const query = "SELECT * FROM confirmed_order WHERE UserID = ? ORDER BY ConfirmedDate DESC";
    
    db.query(query, [repID], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "No confirmed orders found for this Rep." });
        }
        res.json(results);
    });
});

// Revert a confirmed order to pending, refill inventory, and update total value
router.put('/confirmed-orders/revert/:orderId', async (req, res) => {
    const { orderId } = req.params;
    db.beginTransaction(async (err) => {
        if (err) return res.status(500).json({ error: 'Transaction error', details: err.message });
        try {
            // 1. Get order info and details
            db.query('SELECT * FROM confirmed_order WHERE OrderID = ?', [orderId], (err, orderRows) => {
                if (err || orderRows.length === 0) return db.rollback(() => res.status(404).json({ error: 'Order not found' }));
                const order = orderRows[0];
                db.query('SELECT * FROM order_details WHERE orderId = ?', [orderId], (err, details) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: 'Order details error', details: err.message }));
                    // 2. Refill inventory
                    const refillTasks = details.map(detail => {
                        return new Promise((resolve, reject) => {
                            db.query('UPDATE products SET Quantity = Quantity + ? WHERE Name = ?', [detail.quantity, detail.product_name], (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                    });
                    Promise.all(refillTasks).then(() => {
                        // 3. Insert into pending_orders
                        const insertPending = `INSERT INTO pending_orders (orderId, pharmacy_name, rep_name, total_value, order_date, UserID, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
                        db.query(insertPending, [order.OrderID, order.PharmacyName, order.RepName, order.TotalValue, order.OrderDate, order.UserID], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ error: 'Insert pending error', details: err.message }));
                            // 4. Remove from confirmed_order
                            db.query('DELETE FROM confirmed_order WHERE OrderID = ?', [orderId], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ error: 'Delete confirmed error', details: err.message }));
                                db.commit((err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ error: 'Commit error', details: err.message }));
                                    res.json({ message: 'Order reverted to pending, inventory refilled.' });
                                });
                            });
                        });
                    }).catch((err) => db.rollback(() => res.status(500).json({ error: 'Inventory refill error', details: err.message })));
                });
            });
        } catch (e) {
            db.rollback(() => res.status(500).json({ error: 'Unexpected error', details: e.message }));
        }
    });
});

module.exports = router;
