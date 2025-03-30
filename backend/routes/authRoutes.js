const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // MySQL connection
require("dotenv").config();

const router = express.Router();

// Login Route (No Registration)
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Include `role` in the query
  const query = "SELECT id, username, role FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = results[0]; // Get user data

    // Generate JWT Token including `role`
    const token = jwt.sign(
      { userID: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful!",
      token,
      userID: user.id,
      role: user.role, // Now role is included in the response
    });
  });
});

module.exports = router;
