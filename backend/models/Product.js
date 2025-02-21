const db = require("../config/db");

// Get all products
const getAllProducts = (callback) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

// Add a new product
const addProduct = (product, callback) => {
  const { Name, BatchNumber, ExpiryDate, Quantity, UnitPrice } = product;
  const sql = "INSERT INTO products (Name, BatchNumber, ExpiryDate, Quantity, UnitPrice) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [Name, BatchNumber, ExpiryDate, Quantity, UnitPrice], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

// Update a product
const updateProduct = (productID, product, callback) => {
  const { Name, BatchNumber, ExpiryDate, Quantity, UnitPrice } = product;
  const sql = "UPDATE products SET Name = ?, BatchNumber = ?, ExpiryDate = ?, Quantity = ?, UnitPrice = ? WHERE ProductID = ?";
  db.query(sql, [Name, BatchNumber, ExpiryDate, Quantity, UnitPrice, productID], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

// Delete a product
const deleteProduct = (productID, callback) => {
  const sql = "DELETE FROM products WHERE ProductID = ?";
  db.query(sql, [productID], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
};

module.exports = { getAllProducts, addProduct, updateProduct, deleteProduct };