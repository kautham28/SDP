const express = require("express");
const router = express.Router();
const { getAllProducts } = require("../../models/Product");

// Route to get all products
router.get("/", (req, res) => {
  getAllProducts((err, products) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(products);
  });
});

module.exports = router;
