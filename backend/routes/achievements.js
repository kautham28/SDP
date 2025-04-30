const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Fetch achievements by RepID
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

// Create a new achievement record
router.post("/", (req, res) => {
    const { RepID, Month, Year, Target, TotalSales, percentage } = req.body;

    // Basic validation
    if (!RepID || !Month || !Year) {
        return res.status(400).json({ error: "RepID, Month, and Year are required." });
    }

    // Optional: Calculate percentage if not provided
    const calcPercentage = Target && TotalSales
        ? ((parseFloat(TotalSales) / parseFloat(Target)) * 100).toFixed(2)
        : 0.00;

    const sql = `
        INSERT INTO rep_achievements
        (RepID, Month, Year, Target, TotalSales, percentage)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            RepID,
            Month,
            Year,
            Target || 0.00,
            TotalSales || 0.00,
            percentage !== undefined ? percentage : calcPercentage
        ],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: "Record for this RepID, Month, and Year already exists." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Achievement record created successfully." });
        }
    );
});

// GET all achievements with representative names and photo links
router.get("/", (req, res) => {
    const sql = `
        SELECT r.RepID, r.Month, r.Year, r.Target, r.TotalSales, r.percentage, r.LastUpdated, 
               u.username AS name, u.photo_link
        FROM rep_achievements r
        LEFT JOIN users u ON r.RepID = u.id
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching achievements with names and photos:", err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "No achievements found" });
        }
        res.json(results);
    });
});
  
  // OPTIONAL: GET achievements for a specific month/year
  router.get('/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const sql = 'SELECT * FROM rep_achievements WHERE Year = ? AND Month = ?';
    db.query(sql, [year, month], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });
  
module.exports = router;
