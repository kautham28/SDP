const express = require('express');
const router = express.Router();
const db = require('../config/db.js'); // Your database connection

// Fetch all routes
router.get('/routes', (req, res) => {
  const sql = 'SELECT * FROM Routes';
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

// Fetch pharmacies for a specific route
router.get('/routes/:routeID/pharmacies', (req, res) => {
  const routeID = req.params.routeID;
  const sql = `
    SELECT RD.PharmacyName, RD.Address, RD.GoogleMapLink
FROM Routes R
JOIN Route_Details RD ON R.RouteID = RD.RouteID
   WHERE R.RouteID = ?`;

  db.query(sql, [routeID], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
