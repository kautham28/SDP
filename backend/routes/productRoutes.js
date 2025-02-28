const express = require("express");
const db = require("../config/db"); // Import database connection
const { addProduct, updateProduct, deleteProduct } = require("../models/Product"); // Import functions
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

// Route to add a new product
router.post("/", (req, res) => {
  const newProduct = req.body;
  addProduct(newProduct, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json(result);
  });
});

// Route to update a product
router.put("/:id", (req, res) => {
  const productID = req.params.id;
  const updatedProduct = req.body;
  updateProduct(productID, updatedProduct, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(result);
  });
});

// Route to delete a product
router.delete("/:id", (req, res) => {
  const productID = req.params.id;
  deleteProduct(productID, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(result);
  });
});

// Get products expiring within 60 days
router.get("/expiring-soon", (req, res) => {
  const sql = "SELECT * FROM products WHERE ExpiryDate <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});

router.get("/low-stock", (req, res) => {
  const sql = "SELECT * FROM products WHERE Quantity < 100";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});


module.exports = router;