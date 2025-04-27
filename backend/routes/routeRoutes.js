const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Your DB connection

// Existing: Get all routes
router.get("/routes", (req, res) => {
  const query = "SELECT * FROM routes";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching routes:", err);
      res.status(500).send("Error fetching routes");
      return;
    }
    res.json(results);
  });
});

// Existing: Get routes by RepID
router.get("/routes/rep/:RepID", (req, res) => {
  const RepID = req.params.RepID;
  if (!RepID) {
    return res.status(400).send("RepID is required");
  }

  const query = "SELECT * FROM routes WHERE RepID = ?";
  db.query(query, [RepID], (err, results) => {
    if (err) {
      console.error("Error fetching routes for RepID:", err);
      return res.status(500).send("Error fetching routes");
    }

    if (results.length === 0) {
      return res.status(404).send(`No routes found for RepID: ${RepID}`);
    }

    res.json(results);
  });
});

router.post("/routes", (req, res) => {
  const { RepName, RouteDate, RouteArea, RepID, pharmacies } = req.body;

  if (!RepName || !RouteDate || !RouteArea || !RepID || !pharmacies) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // First generate a new RouteID manually
  const getMaxRouteIDQuery = `SELECT RouteID FROM routes ORDER BY RouteID DESC LIMIT 1`;

  db.query(getMaxRouteIDQuery, (err, result) => {
    if (err) {
      console.error("Error fetching max RouteID:", err);
      return res.status(500).json({ message: "Error fetching max RouteID", error: err });
    }

    let newRouteID = "R001"; // Default if table is empty
    if (result.length > 0) {
      const lastRouteID = result[0].RouteID; // Example: 'R005'
      const numberPart = parseInt(lastRouteID.substring(1)) + 1; // 5 + 1 = 6
      newRouteID = 'R' + numberPart.toString().padStart(3, '0'); // 'R006'
    }

    // Now insert into routes
    const insertRouteQuery = `
      INSERT INTO routes (RouteID, RepName, RouteDate, RouteArea, RepID)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertRouteQuery, [newRouteID, RepName, RouteDate, RouteArea, RepID], (err, routeResult) => {
      if (err) {
        console.error("Error inserting into routes:", err);
        return res.status(500).json({ message: "Error inserting into routes", error: err });
      }

      console.log("Inserted into routes:", routeResult);

      // Then insert into route_details
      const insertDetailsQuery = `
        INSERT INTO route_details (RouteID, PharmacyName, Address, GoogleMapLink)
        VALUES ?
      `;

      const detailsValues = pharmacies.map(pharmacy => [
        newRouteID,  // use the manually generated RouteID
        pharmacy.PharmacyName,
        pharmacy.Address,
        pharmacy.GoogleMapLink
      ]);

      db.query(insertDetailsQuery, [detailsValues], (err, detailsResult) => {
        if (err) {
          console.error("Error inserting into route_details:", err);
          return res.status(500).json({ message: "Error inserting into route_details", error: err });
        }

        console.log("Inserted into route_details:", detailsResult);
        res.status(201).json({ message: "Route and Route Details inserted successfully" });
      });
    });
  });
});


module.exports = router;
