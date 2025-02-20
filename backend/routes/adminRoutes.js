const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json({ message: "Welcome to the Admin Dashboard" });
});

module.exports = router;
