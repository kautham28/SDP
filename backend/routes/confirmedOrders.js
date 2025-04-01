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

module.exports = router;
