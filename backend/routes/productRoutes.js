const express = require("express");
const db = require("../config/db"); // Import database connection
const router = express.Router();

// Get all products
router.get("/", (req, res) => {
  const sql = "SELECT * FROM products"; // Fetch all products from the database
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results); // Send product data as JSON
  });
});

module.exports = router;
