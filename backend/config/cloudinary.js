require('dotenv').config();  // Load environment variables from .env file

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // Use environment variables
  api_key: process.env.CLOUDINARY_API_KEY,       // Use environment variables
  api_secret: process.env.CLOUDINARY_API_SECRET  // Use environment variables
});

module.exports = cloudinary;
