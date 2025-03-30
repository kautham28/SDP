const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

// Example route
router.get("/", (req, res) => {
  res.json({ message: "Admin Dashboard" });
});

module.exports = router;
