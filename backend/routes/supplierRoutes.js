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

module.exports = router;