const express = require("express");
const router = express.Router();
const db = require("../config/db"); 

// Fetch all suppliers
router.get("/", (req, res) => {
    const sql = "SELECT * FROM suppliers";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching suppliers:", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json(results);
    });
});

// Add a new supplier
router.post("/", (req, res) => {
    const { CompanyName, PhoneNumber, Address, SupplierEmail } = req.body;
    
    // Validate required fields
    if (!CompanyName || !PhoneNumber || !Address) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = "INSERT INTO suppliers (CompanyName, PhoneNumber, Address, SupplierEmail) VALUES (?, ?, ?, ?)";
    const values = [CompanyName, PhoneNumber, Address, SupplierEmail || null];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding supplier:", err);
            return res.status(500).json({ error: "Failed to add supplier" });
        }
        res.status(201).json({ 
            message: "Supplier added successfully", 
            SupplierID: result.insertId 
        });
    });
});

module.exports = router;