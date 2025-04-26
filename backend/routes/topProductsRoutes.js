const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Top 10 Selling Products in Last 30 Days
router.get("/top-products", (req, res) => {
    const query = `
        SELECT 
            od.product_name,
            SUM(od.quantity) AS total_quantity_sold,
            SUM(od.total_price) AS total_sales_value
        FROM 
            order_details od
        INNER JOIN 
            pending_orders po ON od.orderId = po.orderId
        WHERE 
            po.order_date >= CURDATE() - INTERVAL 30 DAY
        GROUP BY 
            od.product_name
        ORDER BY 
            total_quantity_sold DESC
        LIMIT 10;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching top products:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// Most Valuable Customers in Last 30 Days
router.get("/valuable-customers", (req, res) => {
    const query = `
        SELECT 
            po.pharmacy_name,
            po.rep_name,
            SUM(po.total_value) AS total_order_value
        FROM 
            pending_orders po
        WHERE 
            po.order_date >= CURDATE() - INTERVAL 30 DAY
        GROUP BY 
            po.pharmacy_name, po.rep_name
        ORDER BY 
            total_order_value DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching valuable customers:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

module.exports = router;
