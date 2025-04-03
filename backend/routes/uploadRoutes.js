const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary'); // Ensure this path is correct
const router = express.Router();

// Set up multer to store images in memory (important for Cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

// POST route to upload image to Cloudinary
router.post('/upload', upload.single('image'), (req, res) => {
  // Log the file to check if it's being received correctly
  console.log(req.file);  // This should log the file details

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // If file is received, upload it to Cloudinary
  cloudinary.uploader.upload_stream(
    { resource_type: 'auto' }, // Cloudinary auto resource type (handles images and videos)
    (error, result) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({
        message: 'Image uploaded successfully',
        url: result.secure_url, // The Cloudinary URL of the uploaded image
      });
    }
  ).end(req.file.buffer);  // Send the file buffer to Cloudinary
});

module.exports = router;
