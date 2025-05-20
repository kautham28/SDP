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

// Fetch all users with status = 'working'
router.get("/", (req, res) => {
  const sql = "SELECT id, username, role, email, phone_number, address, ic_number, date_of_birth, status, photo_link FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Fetch user by ID
router.get("/:id", (req, res) => {
  const sql = "SELECT id, username, role, email, phone_number, address, ic_number, date_of_birth, status, photo_link FROM users WHERE id = ?";
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
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  let { username, email, phone_number, address, ic_number, date_of_birth, password, photo_link } = req.body;

  console.log("Update attempt for ID:", id, req.body);

  // Validation: Make sure required fields are present
  if (!username || !email || !phone_number || !address || !ic_number || !date_of_birth) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Prepare fields to update
  let fields = ["username = ?", "email = ?", "phone_number = ?", "address = ?", "ic_number = ?", "date_of_birth = ?"];
  let values = [username, email, phone_number, address, ic_number, date_of_birth];

  // If password is provided, hash and update it
  if (password) {
    const bcrypt = require("bcrypt");
    password = await bcrypt.hash(password, 10);
    fields.push("password = ?");
    values.push(password);
  }

  // If photo_link is provided, update it
  if (photo_link) {
    fields.push("photo_link = ?");
    values.push(photo_link);
  }

  values.push(id);

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
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

// Update user status
router.put("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["working", "terminated"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const sql = "UPDATE users SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Status updated successfully" });
  });
});

module.exports = router;