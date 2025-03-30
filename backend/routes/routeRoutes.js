const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Assuming your database connection is in config/db.js

// Existing route to get all routes
router.get("/routes", (req, res) => {
  const query = "SELECT * FROM routes";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching routes:", err);
      res.status(500).send("Error fetching routes");
      return;
    }
    console.log("Routes fetched:", results);
    res.json(results);
  });
});

// Route to fetch routes for a specific RepID
router.get("/routes/rep/:RepID", (req, res) => {
  const RepID = req.params.RepID;  // Extract RepID from URL parameter

  // Ensure RepID is provided
  if (!RepID) {
    return res.status(400).send("RepID is required");
  }

  // Query to fetch routes based on RepID
  const getRoutesQuery = "SELECT * FROM routes WHERE RepID = ?";
  
  db.query(getRoutesQuery, [RepID], (err, routeResults) => {
    if (err) {
      console.error("Error fetching routes for RepID:", err);
      return res.status(500).send("Error fetching routes");
    }

    if (routeResults.length === 0) {
      return res.status(404).send(`No routes found for RepID: ${RepID}`);
    }

    console.log(`Routes for RepID ${RepID}:`, routeResults);
    res.json(routeResults); // Send filtered routes as response
  });
});

module.exports = router;
