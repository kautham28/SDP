const db = require("../config/db");

// Get all products
const getAllProducts = (callback) => {
  db.query("SELECT * FROM product", (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
};

module.exports = { getAllProducts };
