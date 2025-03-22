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

module.exports = router;
