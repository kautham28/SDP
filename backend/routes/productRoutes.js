const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const mysql = require("mysql");
const db = require("../config/db"); // Import database connection
const { addProduct, updateProduct, deleteProduct } = require("../models/Product"); // Import functions
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Temporary storage location before uploading to Cloudinary
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique file names
  },
});

const upload = multer({ storage: storage });

// Get all products
router.get("/", (req, res) => {
  const sql = "SELECT * FROM products"; // Fetch all products from the database
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results); // Send product data as JSON
  });
});

// Route to fetch report page data
router.get("/report", (req, res) => {
  const sql = `
    SELECT 
      ProductID, 
      Name AS MedicineName, 
      GenericName, 
      ExpiryDate, 
      UnitPrice, 
      Quantity, 
      TotalPrice 
    FROM products
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching report data:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});

// Route to delete a product
router.delete("/:id", (req, res) => {
  const productID = req.params.id;
  deleteProduct(productID, (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(result);
  });
});

// Get products expiring within 60 days
router.get("/expiring-soon", (req, res) => {
  const sql = "SELECT * FROM products WHERE ExpiryDate <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});

router.get("/low-stock", (req, res) => {
  const sql = "SELECT * FROM products WHERE Quantity < MinStock";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching low-stock products:", err);
      return res.status(500).json({ error: "Database query error" });
    }
    res.json(results);
  });
});

// Get products by supplier
router.get("/get-products-by-supplier", (req, res) => {
  const supplierID = req.query.SupplierID;

  if (!supplierID) {
    return res.status(400).json({ error: "SupplierID is required" });
  }

  const sql = "SELECT Name, UnitPrice FROM products WHERE SupplierID = ?";
  db.query(sql, [supplierID], (err, results) => {
    if (err) {
      console.error("Error fetching products for SupplierID:", err);
      return res.status(500).json({ error: "Database query error" });
    }

    res.json(results); // Return the products as JSON
  });
});

// Route to add a new product with Cloudinary image upload
router.post("/", upload.single("Image"), (req, res) => {
  const {
    Name,
    BatchNumber,
    ExpiryDate,
    Quantity,
    UnitPrice,
    SupplierName,
    DeliveryDate,
    SupplierEmail,
    MinStock,
    SupplierID,
    GenericName,
  } = req.body;

  if (!Name || !BatchNumber || !ExpiryDate || !Quantity || !UnitPrice) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Upload the image to Cloudinary
  if (req.file) {
    cloudinary.uploader.upload(req.file.path, (error, result) => {
      if (error) {
        console.error("Error uploading image to Cloudinary:", error);
        return res.status(500).json({ error: "Image upload failed" });
      }

      // Get the Cloudinary image URL
      const imageUrl = result.secure_url;

      // Save product details along with the image URL in the database
      const sql = `INSERT INTO products (Name, BatchNumber, ExpiryDate, Quantity, UnitPrice, SupplierName, DeliveryDate, SupplierEmail, MinStock, SupplierID, GenericName, ImagePath) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(
        sql,
        [
          Name,
          BatchNumber,
          ExpiryDate,
          Quantity,
          UnitPrice,
          SupplierName,
          DeliveryDate,
          SupplierEmail,
          MinStock,
          SupplierID,
          GenericName,
          imageUrl, // Save Cloudinary URL in the ImagePath column
        ],
        (err, result) => {
          if (err) {
            console.error("Error adding product:", err);
            return res.status(500).json({ error: "Database error" });
          }
          res.status(201).json({ message: "Product added successfully", productID: result.insertId });
        }
      );
    });
  } else {
    // If no image is uploaded, set ImagePath to null
    const sql = `INSERT INTO products (Name, BatchNumber, ExpiryDate, Quantity, UnitPrice, SupplierName, DeliveryDate, SupplierEmail, MinStock, SupplierID, GenericName, ImagePath) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [
        Name,
        BatchNumber,
        ExpiryDate,
        Quantity,
        UnitPrice,
        SupplierName,
        DeliveryDate,
        SupplierEmail,
        MinStock,
        SupplierID,
        GenericName,
        null, // No image uploaded, ImagePath is null
      ],
      (err, result) => {
        if (err) {
          console.error("Error adding product:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "Product added successfully", productID: result.insertId });
      }
    );
  }
});



module.exports = router;
