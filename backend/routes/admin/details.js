const express = require('express');
const router = express.Router();
const db = require('../../config/db.js'); // Ensure this is your database connection file

// Get order details by orderId
router.get('/details/:orderId', (req, res) => {
    const { orderId } = req.params;

    const query = 'SELECT * FROM order_details WHERE orderId = ?';

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(results);
    });
});

module.exports = router;
