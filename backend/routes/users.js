const express = require("express");
const router = express.Router();
const db = require("../config/db.js");
const authMiddleware = require('../middleware/authMiddleware');

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

// Add a new user
router.post("/add-user", (req, res) => {
    const { username, password, role, email, phone_number, address, ic_number, date_of_birth } = req.body;

    // Validation (check if all required fields are provided)
    if (!username || !password || !role || !email || !phone_number || !address || !ic_number || !date_of_birth) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // SQL query to insert a new user into the database
    const sql = "INSERT INTO users (username, password, role, email, phone_number, address, ic_number, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [username, password, role, email, phone_number, address, ic_number, date_of_birth], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Respond with success message and the newly added user's data
        res.status(201).json({ message: "User created successfully", userId: result.insertId });
    });
});

router.put('/users/update/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { username, email, phone_number, address, ic_number, date_of_birth } = req.body;
    
    console.log('Update attempt for ID:', id, req.body);

    // Validation: Make sure required fields are present
    if (!username || !email || !phone_number || !address || !ic_number || !date_of_birth) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // SQL query to update the user in the database
    const sql = `
        UPDATE users 
        SET username = ?, email = ?, phone_number = ?, address = ?, ic_number = ?, date_of_birth = ?
        WHERE id = ?
    `;

    db.query(sql, [username, email, phone_number, address, ic_number, date_of_birth, id], (err, result) => {
        if (err) {
            console.log('SQL Error:', err);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User updated successfully" });
    });
});









module.exports = router;
