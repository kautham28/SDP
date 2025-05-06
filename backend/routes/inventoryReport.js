const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/analytics (Route for Inventory Report - Products Table)
router.get('/analytics', (req, res) => {
    // Current date for expiry checks
    const currentDate = new Date().toISOString().split('T')[0];

    // 1. Fetch all products
    const productsSQL = `
        SELECT p.*, 
               CASE WHEN p.ExpiryDate < ? THEN 1 ELSE 0 END as isExpired
        FROM Products p
    `;

    db.query(productsSQL, [currentDate], (err, products) => {
        if (err) {
            console.error('Error fetching products:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error fetching product analytics',
                error: err.message
            });
        }

        // 2. Calculate total value and expired value
        const totalValue = products.reduce((sum, p) => sum + parseFloat(p.TotalPrice || 0), 0).toFixed(2);
        const totalExpiredValue = products
            .filter(p => p.isExpired)
            .reduce((sum, p) => sum + parseFloat(p.TotalPrice || 0), 0)
            .toFixed(2);

        // 3. Calculate total expired percentage (expired value / total value * 100)
        const totalExpiredPercentage = parseFloat(totalValue) > 0 
            ? ((parseFloat(totalExpiredValue) / parseFloat(totalValue)) * 100).toFixed(2) 
            : 0;

        // 4. Supplier-wise total value and expired value
        const supplierSQL = `
            SELECT 
                SupplierName,
                COALESCE(SUM(TotalPrice), 0) as totalValue,
                COALESCE(SUM(CASE WHEN ExpiryDate < ? THEN TotalPrice ELSE 0 END), 0) as expiredValue
            FROM Products
            GROUP BY SupplierName
        `;

        db.query(supplierSQL, [currentDate], (supplierErr, supplierValues) => {
            if (supplierErr) {
                console.error('Error fetching supplier analytics:', supplierErr.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching supplier analytics',
                    error: supplierErr.message
                });
            }

            // Response object
            const analytics = {
                totalValue: parseFloat(totalValue),
                totalExpiredValue: parseFloat(totalExpiredValue),
                totalExpiredPercentage: `${totalExpiredPercentage}%`,
                supplierAnalytics: supplierValues.map(supplier => ({
                    supplierName: supplier.SupplierName || 'Unknown',
                    totalValue: parseFloat(supplier.totalValue).toFixed(2),
                    expiredValue: parseFloat(supplier.expiredValue).toFixed(2),
                    expiredPercentage: parseFloat(supplier.totalValue) > 0 
                        ? ((parseFloat(supplier.expiredValue) / parseFloat(supplier.totalValue)) * 100).toFixed(2) + '%' 
                        : '0.00%'
                })),
                products: products.map(p => ({
                    productId: p.ProductID,
                    name: p.Name,
                    batchNumber: p.BatchNumber,
                    expiryDate: p.ExpiryDate,
                    totalPrice: parseFloat(p.TotalPrice || 0).toFixed(2)
                }))
            };

            res.json({
                success: true,
                data: analytics
            });
        });
    });
});

module.exports = router;