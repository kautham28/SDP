const express = require("express");
const router = express.Router();
const db = require("../config/db.js");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// Configure nodemailer transporter (reusing the same configuration)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
router.post("/add-user", async (req, res) => {
  const { username, password, role, email, phone_number, address, ic_number, date_of_birth } = req.body;

  // Validate required fields
  if (!username || !password || !role || !email || !phone_number || !address || !ic_number || !date_of_birth) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate role
  const validRoles = ["Admin", "Manager", "Rep"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const sql = "INSERT INTO users (username, password, role, email, phone_number, address, ic_number, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [username, hashedPassword, role, email, phone_number, address, ic_number, date_of_birth], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Send email to the user with their details
      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@yourpharmacyapp.com",
        to: email,
        subject: "Welcome! Your Account Details",
        html: `
          <h2>Welcome to the System, ${username}!</h2>
          <p>Your account has been successfully created. Below are your account details:</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Username:</td>
              <td style="padding: 8px;">${username}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Password:</td>
              <td style="padding: 8px;">${password}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Role:</td>
              <td style="padding: 8px;">${role}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;">${email}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Phone Number:</td>
              <td style="padding: 8px;">${phone_number}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Address:</td>
              <td style="padding: 8px;">${address}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">IC Number:</td>
              <td style="padding: 8px;">${ic_number}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="padding: 8px; font-weight: bold;">Date of Birth:</td>
              <td style="padding: 8px;">${date_of_birth}</td>
            </tr>
          </table>
          <p>Please keep this information secure and do not share your password with anyone.</p>
          <p>If you have any questions, contact our support team.</p>
          <p>Best regards,<br>Your System Team</p>
        `,
      };

      // Send the email
      transporter.sendMail(mailOptions, (emailErr, info) => {
        if (emailErr) {
          console.error("Email sending error:", emailErr);
          // Note: We still return success for user creation even if email fails
          return res.status(201).json({
            message: "User created successfully, but failed to send email",
            userId: result.insertId,
          });
        }
        res.status(201).json({
          message: "User created successfully and email sent",
          userId: result.insertId,
        });
      });
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/users/update/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { username, email, phone_number, address, ic_number, date_of_birth } = req.body;

  console.log("Update attempt for ID:", id, req.body);

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
      console.log("SQL Error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  });
});

module.exports = router;