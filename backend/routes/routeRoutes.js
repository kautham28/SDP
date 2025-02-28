// routeRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Assuming your database connection is in config/db.js

router.get("/routes", (req, res) => {
  const query = "SELECT * FROM routes";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching routes:", err);
      res.status(500).send("Error fetching routes");
      return;
    }
    console.log('Routes fetched:', results); // Log the results for debugging
    res.json(results);
  });
});

module.exports = router;
