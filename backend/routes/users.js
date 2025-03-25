const express = require("express");
const router = express.Router();
const db = require("../config/db.js");

// Fetch all users
router.get("/", (req, res) => {
    const sql = "SELECT id, username, role, email, phone_number, address, ic_number, date_of_birth FROM users";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Fetch user by ID
router.get("/:id", (req, res) => {
    const sql = "SELECT id, username, role, email, phone_number, address, ic_number, date_of_birth FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(results[0]);
    });
});

module.exports = router;
