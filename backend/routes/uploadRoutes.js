const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Set up multer to store images in the uploads folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});
const upload = multer({ storage });

// Debug route to check if /api/upload is reachable
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Upload route is working' });
});

// POST route to upload image to local uploads folder
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the relative URL to the uploaded file
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    message: 'Image uploaded successfully',
    url: fileUrl,
  });
});

// Also support /api/upload (no trailing slash)
router.post('', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    message: 'Image uploaded successfully',
    url: fileUrl,
  });
});

module.exports = router;
