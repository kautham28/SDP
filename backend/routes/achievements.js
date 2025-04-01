const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch achievements by logged-in user (RepID)
router.get("/:id", (req, res) => {
    const sql = `SELECT * FROM rep_achievements WHERE RepID = ? ORDER BY Year DESC, Month DESC`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "No achievements found" });
        }
        res.json(results);
    });
});

module.exports = router;
