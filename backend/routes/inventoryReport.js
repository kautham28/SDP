const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// POST /api/reports/analytics/pdf
router.post('/analytics/pdf', (req, res) => {
    const { analytics, charts } = req.body;

    if (!analytics || !charts) {
        console.error('Missing required fields in request body:', req.body);
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: analytics or charts'
        });
    }

    console.log(`Received analytics data with ${analytics.products.length} products`);

    try {
        const doc = new PDFDocument({
            margin: 30,
            bufferPages: true,
            size: 'A4',
            layout: 'portrait',
            autoFirstPage: false
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ram_medical_inventory_report.pdf`);

        doc.pipe(res);

        doc.addPage({ margin: 30 });

        const drawPageBorder = () => {
            doc.save()
               .lineWidth(2)
               .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
               .stroke('#3182ce')
               .restore();
        };

        const drawHeader = () => {
            doc.save()
               .fillColor('#f0f8ff')
               .rect(20, 20, doc.page.width - 40, 80)
               .fill()
               .restore();

            doc.font('Helvetica-Bold')
               .fontSize(24)
               .fillColor('#2c5282')
               .text('RAM MEDICAL', 40, 40);

            doc.font('Helvetica')
               .fontSize(14)
               .fillColor('#4a5568')
               .text('Inventory Status Report', 40, 70);

            const currentDate = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.fontSize(10)
               .fillColor('#718096')
               .text(currentDate, doc.page.width - 200, 70, { align: 'right' });
        };

        const drawFilters = (y) => {
            doc.save()
               .rect(40, y, doc.page.width - 80, 50)
               .fillAndStroke('#f0f8ff', '#3182ce');

            doc.fillColor('#2d3748')
               .font('Helvetica-Bold')
               .fontSize(12)
               .text('Filters:', 50, y + 10);

            doc.font('Helvetica')
               .fontSize(10)
               .text('None', 100, y + 10, { width: doc.page.width - 160 });

            doc.restore();
            return y + 70;
        };

        const drawInventoryOverview = (y) => {
            doc.save()
               .rect(40, y, doc.page.width - 80, 80)
               .fillAndStroke('#f9f9f9', '#3182ce');

            doc.fillColor('#2d3748')
               .font('Helvetica-Bold')
               .fontSize(12)
               .text('Inventory Overview', 50, y + 10);

            doc.font('Helvetica')
               .fontSize(10)
               .fillColor('#4a5568')
               .text(`Total Value: $${analytics.totalValue.toFixed(2)}`, 50, y + 30);

            doc.fillColor('#4a5568')
               .text(`Total Expired Value: $${analytics.totalExpiredValue.toFixed(2)}`, 50, y + 50);

            doc.restore();
            return y + 100;
        };

        const drawTotalExpiredChart = (y, chartImage) => {
            if (y + 240 > doc.page.height - 50) {
                console.log('Adding new page for total expired chart');
                doc.addPage({ margin: 30 });
                drawPageBorder();
                drawHeader();
                y = 120;
            }

            if (chartImage) {
                doc.save()
                   .rect(40, y, doc.page.width - 80, 220)
                   .fillAndStroke('#ffffff', '#3182ce');

                doc.fillColor('#2d3748')
                   .font('Helvetica-Bold')
                   .fontSize(12)
                   .text('Total Expired Percentage', 50, y + 10);

                doc.image(Buffer.from(chartImage.split(',')[1], 'base64'), {
                    x: (doc.page.width - 200) / 2,
                    y: y + 30,
                    fit: [200, 170],
                    align: 'center'
                });

                doc.font('Helvetica')
                   .fontSize(10)
                   .fillColor('#718096')
                   .text(`Expired: ${analytics.totalExpiredPercentage}`, (doc.page.width) / 2, y + 210, { align: 'center' });

                doc.restore();
                return y + 240;
            }
            return y;
        };

        const drawSupplierBarChart = (y, chartImage) => {
            if (y + 240 > doc.page.height - 50) {
                console.log('Adding new page for supplier bar chart');
                doc.addPage({ margin: 30 });
                drawPageBorder();
                drawHeader();
                y = 120;
            }

            if (chartImage) {
                doc.save()
                   .rect(40, y, doc.page.width - 80, 220)
                   .fillAndStroke('#ffffff', '#3182ce');

                doc.fillColor('#2d3748')
                   .font('Helvetica-Bold')
                   .fontSize(12)
                   .text('Supplier Total Value', 50, y + 10);

                doc.image(Buffer.from(chartImage.split(',')[1], 'base64'), {
                    x: (doc.page.width - 400) / 2,
                    y: y + 30,
                    fit: [400, 170],
                    align: 'center'
                });

                doc.restore();
                return y + 240;
            }
            return y;
        };

        const drawSupplierPieCharts = (y, chartImages) => {
            if (y + 240 > doc.page.height - 50) {
                console.log('Adding new page for supplier pie charts');
                doc.addPage({ margin: 30 });
                drawPageBorder();
                drawHeader();
                y = 120;
            }

            if (chartImages && chartImages.length > 0) {
                doc.save()
                   .rect(40, y, doc.page.width - 80, 220)
                   .fillAndStroke('#ffffff', '#3182ce');

                doc.fillColor('#2d3748')
                   .font('Helvetica-Bold')
                   .fontSize(12)
                   .text('Supplier Expiry Breakdown', 50, y + 10);

                const chartWidth = (doc.page.width - 100) / 3;
                chartImages.forEach((chartImage, index) => {
                    if (chartImage) {
                        const x = 50 + (index % 3) * chartWidth;
                        const row = Math.floor(index / 3);
                        doc.image(Buffer.from(chartImage.split(',')[1], 'base64'), {
                            x: x,
                            y: y + 30 + (row * 100),
                            fit: [chartWidth - 20, 70],
                            align: 'center'
                        });
                    }
                });

                doc.restore();
                return y + 240;
            }
            return y;
        };

        const drawProductTable = (y, products) => {
            const columns = [
                { header: 'Product ID', width: 60, property: 'productId' },
                { header: 'Name', width: 100, property: 'name' },
                { header: 'Batch Number', width: 80, property: 'batchNumber' },
                { header: 'Expiry Date', width: 70, property: 'expiryDate' },
                { header: 'Total Price', width: 60, property: 'totalPrice' }
            ];
            const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
            const leftMargin = (doc.page.width - tableWidth) / 2;

            const drawTableHeaders = (y) => {
                doc.save()
                   .fillColor('#2c5282')
                   .rect(leftMargin, y, tableWidth, 25)
                   .fill()
                   .restore();

                doc.save()
                   .fillColor('#ffffff')
                   .font('Helvetica-Bold')
                   .fontSize(8);

                let xPos = leftMargin;
                columns.forEach(column => {
                    doc.text(column.header, xPos + 5, y + 8, { width: column.width - 10, align: 'center' });
                    xPos += column.width;
                });

                doc.restore();
                return y + 25;
            };

            const drawTableRow = (item, y, isAlternate) => {
                const rowHeight = 20;

                if (isAlternate) {
                    doc.save()
                       .fillColor('#f7fafc')
                       .rect(leftMargin, y, tableWidth, rowHeight)
                       .fill()
                       .restore();
                }

                doc.save()
                   .font('Helvetica')
                   .fontSize(7)
                   .fillColor('#2d3748');

                let xPos = leftMargin;
                columns.forEach(column => {
                    doc.text(item[column.property] || '', xPos + 5, y + 6, { width: column.width - 10, align: 'center' });
                    xPos += column.width;
                });

                doc.restore();

                doc.save()
                   .strokeColor('#e2e8f0')
                   .lineWidth(0.5)
                   .moveTo(leftMargin, y + rowHeight)
                   .lineTo(leftMargin + tableWidth, y + rowHeight)
                   .stroke()
                   .restore();

                return y + rowHeight;
            };

            if (y + 25 > doc.page.height - 50) {
                console.log('Adding new page for table header');
                doc.addPage({ margin: 30 });
                drawPageBorder();
                drawHeader();
                y = 120;
            }

            y = drawTableHeaders(y);

            products.forEach((item, i) => {
                if (y + 20 > doc.page.height - 50) {
                    console.log(`Adding new page for table row ${i + 1}`);
                    doc.addPage({ margin: 30 });
                    drawPageBorder();
                    drawHeader();
                    y = 120;
                    y = drawTableHeaders(y);
                }
                y = drawTableRow(item, y, i % 2 === 1);
            });

            return y;
        };

        const drawFooter = (y) => {
            if (y + 20 > doc.page.height - 50) {
                console.log('Adding new page for footer');
                doc.addPage({ margin: 30 });
                drawPageBorder();
                drawHeader();
                y = 120;
            }

            doc.save()
               .font('Helvetica')
               .fontSize(8)
               .fillColor('#718096')
               .text(
                   `Generated on: ${new Date().toLocaleString()} | Ram Medical Inventory Report`,
                   doc.page.width / 2,
                   doc.page.height - 40,
                   { align: 'center' }
               )
               .restore();
        };

        drawPageBorder();
        drawHeader();
        let currentY = 120;

        currentY = drawFilters(currentY);
        currentY = drawInventoryOverview(currentY);
        currentY = drawTotalExpiredChart(currentY, charts.totalPieChart);
        currentY = drawSupplierBarChart(currentY, charts.barChart);
        currentY = drawSupplierPieCharts(currentY, charts.supplierPieCharts);
        currentY = drawProductTable(currentY, analytics.products);
        drawFooter(currentY);

        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error generating PDF',
                error: err.message
            });
        } else {
            console.error('Headers already sent, cannot send error response');
        }
    }
});

module.exports = router;