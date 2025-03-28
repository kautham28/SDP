const express = require('express');
const db = require('../config/db.js');

const router = express.Router();

// Fetch pharmacies by major area
router.get('/area', (req, res) => {
  const { area } = req.query;
  
  if (!area) {
    return res.status(400).json({ error: 'Major area is required' });
  }

  const query = 'SELECT PharmacyID, PharmacyName, PharmacyLocation FROM pharmacies WHERE Area =?';

  db.query(query, [area], (err, results) => {
    if (err) {
      console.error('Error fetching pharmacies by area:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Convert results to JSON format with checkboxes
    const response = results.map(pharmacy => ({
      PharmacyID: pharmacy.PharmacyID,
      PharmacyName: pharmacy.PharmacyName,
      Address: pharmacy.Address,
      Checkbox: `<input type="checkbox" name="pharmacy" value="${pharmacy.PharmacyID}">`
    }));

    res.json(response);
  });
});

// Fetch all pharmacy details from the database
router.get('/all-pharmacies', (req, res) => {
  const query = `
    SELECT PharmacyID, PharmacyName, OwnerName, Area, OwnerEmail, OwnerContact, PharmacyLocation, LocationLink
    FROM pharmacies
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching pharmacies:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Send back all pharmacy details as JSON
    res.json(results);
  });
});

module.exports = router;
