// filepath: /e:/RAM/backend/routes/pendingOrderRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

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

module.exports = router;