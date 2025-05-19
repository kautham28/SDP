// Forgot Password and OTP logic for user password reset
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Use the same transporter as in your other email routes
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// In-memory OTP store (for production, use Redis or DB)
const otpStore = {};

// Request OTP for password reset
router.post('/forgot-password/request-otp', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourpharmacyapp.com',
      to: email,
      subject: 'Your OTP for Password Reset',
      html: `<p>Your OTP for password reset is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ error: 'Failed to send email' });
      res.json({ message: 'OTP sent to email' });
    });
  });
});

// Verify OTP and reset password
router.post('/forgot-password/verify-otp', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });

  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // No hashing, store password as plain text (not recommended for production)
  db.query('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    delete otpStore[email];
    res.json({ message: 'Password reset successful' });
  });
});

module.exports = router;
