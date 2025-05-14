const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Middleware to validate database connection
const checkDbConnection = (req, res, next) => {
  db.ping((err) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: err.message
      });
    }
    next();
  });
};

// GET /api/reports/product-sales-report
router.get('/product-sales-report', checkDbConnection, (req, res) => {
  const { startDate, endDate, productName, pharmacyName, repName } = req.query;

  // Validate date format if provided
  if (startDate && endDate) {
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormat.test(startDate) || !dateFormat.test(endDate)) {
      console.error('Invalid date format:', { startDate, endDate });
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD.',
        error: 'Invalid date format'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      console.error('Invalid date range:', { startDate, endDate });
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date and dates must be valid.',
        error: 'Invalid date range'
      });
    }
  }

  // Query 1: Product-wise Sales Summary
  let productSql = `
    SELECT 
      od.product_name,
      COALESCE(SUM(od.quantity), 0) as totalQuantity,
      COALESCE(SUM(od.total_price), 0) as totalSalesValue,
      COALESCE(AVG(od.unit_price), 0) as avgUnitPrice,
      COUNT(DISTINCT od.orderId) as orderCount,
      GROUP_CONCAT(DISTINCT co.PharmacyName) as pharmacies
    FROM order_details od
    LEFT JOIN confirmed_order co ON od.orderId = co.OrderID
    WHERE 1=1
  `;
  const productParams = [];

  // Query 2: Rep-wise Product Sales Summary
  let repSql = `
    SELECT 
      co.RepName as repName,
      od.product_name,
      COALESCE(SUM(od.quantity), 0) as totalQuantity,
      COALESCE(SUM(od.total_price), 0) as totalSalesValue
    FROM order_details od
    LEFT JOIN confirmed_order co ON od.orderId = co.OrderID
    WHERE 1=1
  `;
  const repParams = [];

  // Query 3: Fast Moving Products (Top 5 by quantity)
  let fastMovingSql = `
    SELECT 
      od.product_name,
      COALESCE(SUM(od.quantity), 0) as totalQuantity,
      COALESCE(SUM(od.total_price), 0) as totalSalesValue,
      COUNT(DISTINCT od.orderId) as orderCount
    FROM order_details od
    LEFT JOIN confirmed_order co ON od.orderId = co.OrderID
    WHERE 1=1
  `;
  const fastMovingParams = [];

  // Apply filters to all queries
  try {
    if (startDate && endDate) {
      productSql += ` AND co.OrderDate BETWEEN ? AND ?`;
      repSql += ` AND co.OrderDate BETWEEN ? AND ?`;
      fastMovingSql += ` AND co.OrderDate BETWEEN ? AND ?`;
      productParams.push(startDate, endDate);
      repParams.push(startDate, endDate);
      fastMovingParams.push(startDate, endDate);
    }
    if (productName) {
      productSql += ` AND od.product_name LIKE ?`;
      repSql += ` AND od.product_name LIKE ?`;
      fastMovingSql += ` AND od.product_name LIKE ?`;
      productParams.push(`%${productName}%`);
      repParams.push(`%${productName}%`);
      fastMovingParams.push(`%${productName}%`);
    }
    if (pharmacyName) {
      productSql += ` AND co.PharmacyName LIKE ?`;
      repSql += ` AND co.PharmacyName LIKE ?`;
      fastMovingSql += ` AND co.PharmacyName LIKE ?`;
      productParams.push(`%${pharmacyName}%`);
      repParams.push(`%${pharmacyName}%`);
      fastMovingParams.push(`%${pharmacyName}%`);
    }
    if (repName) {
      productSql += ` AND co.RepName LIKE ?`;
      repSql += ` AND co.RepName LIKE ?`;
      fastMovingSql += ` AND co.RepName LIKE ?`;
      productParams.push(`%${repName}%`);
      repParams.push(`%${repName}%`);
      fastMovingParams.push(`%${repName}%`);
    }

    productSql += ` GROUP BY od.product_name ORDER BY totalSalesValue DESC`;
    repSql += ` GROUP BY co.RepName, od.product_name ORDER BY co.RepName, totalSalesValue DESC`;
    fastMovingSql += ` GROUP BY od.product_name ORDER BY totalQuantity DESC LIMIT 5`;
  } catch (err) {
    console.error('Error constructing SQL queries:', err);
    return res.status(500).json({
      success: false,
      message: 'Error constructing queries',
      error: err.message
    });
  }

  // Execute queries
  console.log('Executing Product SQL:', productSql, 'with params:', productParams);
  db.query(productSql, productParams, (err, productResults) => {
    if (err) {
      console.error('Error fetching product sales report:', err.message, 'SQL:', productSql, 'Params:', productParams);
      return res.status(500).json({
        success: false,
        message: 'Error fetching product sales report',
        error: err.message
      });
    }

    console.log('Executing Rep SQL:', repSql, 'with params:', repParams);
    db.query(repSql, repParams, (err, repResults) => {
      if (err) {
        console.error('Error fetching rep-wise product sales:', err.message, 'SQL:', repSql, 'Params:', repParams);
        return res.status(500).json({
          success: false,
          message: 'Error fetching rep-wise product sales',
          error: err.message
        });
      }

      console.log('Executing Fast Moving SQL:', fastMovingSql, 'with params:', fastMovingParams);
      db.query(fastMovingSql, fastMovingParams, (err, fastMovingResults) => {
        if (err) {
          console.error('Error fetching fast moving products:', err.message, 'SQL:', fastMovingSql, 'Params:', fastMovingParams);
          return res.status(500).json({
            success: false,
            message: 'Error fetching fast moving products',
            error: err.message
          });
        }

        // Process results with validation
        const productData = Array.isArray(productResults) ? productResults.map(row => ({
          productName: row.product_name || 'Unknown',
          totalQuantity: Number(row.totalQuantity) || 0,
          totalSalesValue: parseFloat(row.totalSalesValue || 0).toFixed(2),
          avgUnitPrice: parseFloat(row.avgUnitPrice || 0).toFixed(2),
          orderCount: Number(row.orderCount) || 0,
          pharmacies: row.pharmacies ? row.pharmacies.split(',') : []
        })) : [];

        const repData = Array.isArray(repResults) ? repResults.map(row => ({
          repName: row.repName || 'Unknown',
          productName: row.product_name || 'Unknown',
          totalQuantity: Number(row.totalQuantity) || 0,
          totalSalesValue: parseFloat(row.totalSalesValue || 0).toFixed(2)
        })) : [];

        const fastMovingData = Array.isArray(fastMovingResults) ? fastMovingResults.map(row => ({
          productName: row.product_name || 'Unknown',
          totalQuantity: Number(row.totalQuantity) || 0,
          totalSalesValue: parseFloat(row.totalSalesValue || 0).toFixed(2),
          orderCount: Number(row.orderCount) || 0
        })) : [];

        res.json({
          success: true,
          data: {
            productSummary: productData,
            repProductSummary: repData,
            fastMovingProducts: fastMovingData
          }
        });
      });
    });
  });
});

// POST /api/reports/generate-product-sales-pdf
router.post('/generate-product-sales-pdf', (req, res) => {
  if (res.headersSent) {
    console.error('Headers already sent, cannot generate PDF');
    return;
  }

  try {
    const { reportType, filters, summary, productData, repData, fastMovingData, charts } = req.body;

    // Validate request body
    if (!productData || !Array.isArray(productData)) {
      console.error('Invalid or missing productData:', productData);
      return res.status(400).json({
        success: false,
        message: 'Product data is required and must be an array'
      });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ram_medical_product_sales_report.pdf`);

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 30, 
      size: 'A4',
      layout: 'landscape',
      autoFirstPage: false
    });

    doc.on('error', (err) => {
      console.error('PDF document error:', err);
      if (!res.headersSent) {
        res.status(500).send('Error generating PDF');
      }
    });

    doc.pipe(res);
    doc.addPage();

    // Load logo
    const logoPath = path.join(__dirname, 'logo.png');
    let logoImage;
    try {
      if (fs.existsSync(logoPath)) {
        logoImage = logoPath;
      }
    } catch (err) {
      console.error('Logo file not found:', err);
    }

    // Draw page border
    doc.lineWidth(2)
       .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .stroke('#3182ce');

    // Draw header background
    doc.fillColor('#f0f8ff')
       .rect(20, 20, doc.page.width - 40, 80)
       .fill();

    // Add logo if available
    if (logoImage) {
      try {
        doc.image(logoImage, 40, 30, { width: 60 });
      } catch (err) {
        console.error('Error adding logo:', err);
      }
    }

    // Add company name
    doc.font('Helvetica')
       .fontSize(24)
       .fillColor('#2c5282')
       .text('RAM MEDICAL', logoImage ? 110 : 40, 40);

    // Add report title
    doc.font('Helvetica')
       .fontSize(14)
       .fillColor('#4a5568')
       .text(reportType || 'Product Sales Report', logoImage ? 110 : 40, 70);

    // Add date
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(10)
       .fillColor('#718096')
       .text(currentDate, doc.page.width - 200, 70, { align: 'right' });

    let currentY = 120;

    // Add filters section
    doc.rect(40, currentY, doc.page.width - 80, 50)
       .fillAndStroke('#f0f8ff', '#3182ce');

    doc.fillColor('#2d3748')
       .font('Helvetica')
       .fontSize(12)
       .text('Filters:', 50, currentY + 10);

    let filterText = 'None';
    if (filters && Object.keys(filters).length > 0) {
      filterText = Object.entries(filters)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('  ');
    }

    doc.font('Helvetica')
       .fontSize(10)
       .text(filterText, 100, currentY + 10, { width: doc.page.width - 160 });

    currentY += 70;

    // Add summary section
    doc.rect(40, currentY, doc.page.width - 80, 60)
       .fillAndStroke('#f9f9f9', '#3182ce');

    doc.fillColor('#2d3748')
       .font('Helvetica')
       .fontSize(12)
       .text('Sales Summary:', 50, currentY + 10);

    if (summary) {
      const summaryData = [
        { label: 'Total Sales Value', value: summary.totalSalesValue || '0.00' },
        { label: 'Total Quantity', value: summary.totalQuantitySold || '0' },
        { label: 'Order Count', value: summary.totalOrderCount || '0' },
        { label: 'Avg. Unit Price', value: summary.avgUnitPrice || '0.00' }
      ];

      const summaryColWidth = (doc.page.width - 100) / 4;

      summaryData.forEach((item, index) => {
        const xPos = 50 + (index * summaryColWidth);
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#4a5568')
           .text(item.label, xPos, currentY + 30);
        doc.font('Helvetica')
           .fontSize(14)
           .fillColor('#2c5282')
           .text(item.value, xPos, currentY + 30 + 15);
      });
    }

    currentY += 80;

    // Add charts
    if (charts && (charts.barChart || charts.pieChart)) {
      doc.rect(40, currentY, doc.page.width - 80, 220)
         .fillAndStroke('#ffffff', '#3182ce');

      doc.fillColor('#2d3748')
         .font('Helvetica')
         .fontSize(12)
         .text('Sales Charts:', 50, currentY + 10);

      if (charts.barChart && charts.pieChart) {
        try {
          const barChartData = charts.barChart.split(',')[1];
          if (barChartData) {
            doc.image(Buffer.from(barChartData, 'base64'), {
              x: 60,
              y: currentY + 30,
              fit: [doc.page.width / 2 - 80, 170],
              align: 'center'
            });
          }

          const pieChartData = charts.pieChart.split(',')[1];
          if (pieChartData) {
            doc.image(Buffer.from(pieChartData, 'base64'), {
              x: doc.page.width / 2 + 20,
              y: currentY + 30,
              fit: [doc.page.width / 2 - 80, 170],
              align: 'center'
            });
          }
        } catch (err) {
          console.error('Error adding charts to PDF:', err);
        }
      } else if (charts.barChart) {
        try {
          const barChartData = charts.barChart.split(',')[1];
          if (barChartData) {
            doc.image(Buffer.from(barChartData, 'base64'), {
              x: (doc.page.width - 400) / 2,
              y: currentY + 30,
              fit: [400, 170],
              align: 'center'
            });
          }
        } catch (err) {
          console.error('Error adding bar chart to PDF:', err);
        }
      } else if (charts.pieChart) {
        try {
          const pieChartData = charts.pieChart.split(',')[1];
          if (pieChartData) {
            doc.image(Buffer.from(pieChartData, 'base64'), {
              x: (doc.page.width - 200) / 2,
              y: currentY + 30,
              fit: [200, 170],
              align: 'center'
            });
          }
        } catch (err) {
          console.error('Error adding pie chart to PDF:', err);
        }
      }

      currentY += 240;
    }

    // Add fast moving products table
    if (fastMovingData && Array.isArray(fastMovingData) && fastMovingData.length > 0) {
      if (currentY + 200 > doc.page.height) {
        doc.addPage();
        doc.lineWidth(2)
           .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
           .stroke('#3182ce');
        currentY = 50;
      } else {
        currentY += 30;
      }

      doc.rect(40, currentY, doc.page.width - 80, 30)
         .fillAndStroke('#3182ce', '#3182ce');

      doc.fillColor('#ffffff')
         .font('Helvetica')
         .fontSize(14)
         .text('Fast Moving Products (Top 5)', (doc.page.width) / 2, currentY + 8, { align: 'center' });

      currentY += 40;

      const fastMovingColumns = [
        { header: 'Product Name', width: 150 },
        { header: 'Quantity Sold', width: 100 },
        { header: 'Sales Value', width: 100 },
        { header: 'Order Count', width: 100 }
      ];

      const fastMovingTableWidth = fastMovingColumns.reduce((sum, col) => sum + col.width, 0);
      const fastMovingLeftMargin = (doc.page.width - fastMovingTableWidth) / 2;

      doc.fillColor('#f2f2f2')
         .rect(fastMovingLeftMargin, currentY, fastMovingTableWidth, 25)
         .fill();

      doc.fillColor('#000000')
         .font('Helvetica')
         .fontSize(10);

      let xPos = fastMovingLeftMargin;
      fastMovingColumns.forEach(column => {
        doc.text(
          column.header,
          xPos + 5,
          currentY + 8,
          { width: column.width - 10, align: 'center' }
        );
        xPos += column.width;
      });

      doc.lineWidth(1)
         .rect(fastMovingLeftMargin, currentY, fastMovingTableWidth, 25)
         .stroke();

      currentY += 25;

      for (let i = 0; i < fastMovingData.length; i++) {
        const item = fastMovingData[i];
        const rowHeight = 20;

        if (i % 2 === 1) {
          doc.fillColor('#f9f9f9')
             .rect(fastMovingLeftMargin, currentY, fastMovingTableWidth, rowHeight)
             .fill();
        }

        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#2d3748');

        xPos = fastMovingLeftMargin;

        doc.text(item.productName || 'Unknown', xPos + 5, currentY + 6, { width: fastMovingColumns[0].width - 10, align: 'left' });
        xPos += fastMovingColumns[0].width;

        doc.text(String(item.totalQuantity || '0'), xPos + 5, currentY + 6, { width: fastMovingColumns[1].width - 10, align: 'center' });
        xPos += fastMovingColumns[1].width;

        doc.text(String(item.totalSalesValue || '0.00'), xPos + 5, currentY + 6, { width: fastMovingColumns[2].width - 10, align: 'center' });
        xPos += fastMovingColumns[2].width;

        doc.text(String(item.orderCount || '0'), xPos + 5, currentY + 6, { width: fastMovingColumns[3].width - 10, align: 'center' });

        doc.lineWidth(0.5)
           .rect(fastMovingLeftMargin, currentY, fastMovingTableWidth, rowHeight)
           .stroke();

        currentY += rowHeight;
      }

      currentY += 20;
    } else {
      console.warn('No fastMovingData provided or invalid format:', fastMovingData);
    }

    // Add product data table
    if (productData && productData.length > 0) {
      if (currentY + 300 > doc.page.height) {
        doc.addPage();
        doc.lineWidth(2)
           .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
           .stroke('#3182ce');
        currentY = 50;
      }

      doc.rect(40, currentY, doc.page.width - 80, 30)
         .fillAndStroke('#3182ce', '#3182ce');

      doc.fillColor('#ffffff')
         .font('Helvetica')
         .fontSize(14)
         .text('Product Sales Details', (doc.page.width) / 2, currentY + 8, { align: 'center' });

      currentY += 40;

      const columns = [
        { header: 'Product Name', width: 120 },
        { header: 'Quantity', width: 70 },
        { header: 'Sales Value', width: 80 },
        { header: 'Avg Price', width: 70 },
        { header: 'Orders', width: 60 },
        { header: 'Pharmacies', width: 140 }
      ];

      const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      const leftMargin = (doc.page.width - tableWidth) / 2;

      doc.fillColor('#f2f2f2')
         .rect(leftMargin, currentY, tableWidth, 25)
         .fill();

      doc.fillColor('#000000')
         .font('Helvetica')
         .fontSize(10);

      let xPos = leftMargin;
      columns.forEach(column => {
        doc.text(
          column.header,
          xPos + 5,
          currentY + 8,
          { width: column.width - 10, align: 'center' }
        );
        xPos += column.width;
      });

      doc.lineWidth(1)
         .rect(leftMargin, currentY, tableWidth, 25)
         .stroke();

      currentY += 25;

      const maxRows = Math.min(productData.length, 20);
      for (let i = 0; i < maxRows; i++) {
        const item = productData[i];
        const rowHeight = 20;

        if (i % 2 === 1) {
          doc.fillColor('#f9f9f9')
             .rect(leftMargin, currentY, tableWidth, rowHeight)
             .fill();
        }

        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#2d3748');

        xPos = leftMargin;

        doc.text(item.productName || 'Unknown', xPos + 5, currentY + 6, { width: columns[0].width - 10, align: 'left' });
        xPos += columns[0].width;

        doc.text(String(item.totalQuantity || '0'), xPos + 5, currentY + 6, { width: columns[1].width - 10, align: 'center' });
        xPos += columns[1].width;

        doc.text(item.totalSalesValue || '0.00', xPos + 5, currentY + 6, { width: columns[2].width - 10, align: 'center' });
        xPos += columns[2].width;

        doc.text(item.avgUnitPrice || '0.00', xPos + 5, currentY + 6, { width: columns[3].width - 10, align: 'center' });
        xPos += columns[3].width;

        doc.text(String(item.orderCount || '0'), xPos + 5, currentY + 6, { width: columns[4].width - 10, align: 'center' });
        xPos += columns[4].width;

        const pharmaciesText = Array.isArray(item.pharmacies) ? 
          item.pharmacies.slice(0, 3).join(', ') + (item.pharmacies.length > 3 ? '...' : '') : 
          'N/A';
        doc.text(pharmaciesText, xPos + 5, currentY + 6, { width: columns[5].width - 10, align: 'left' });

        doc.lineWidth(0.5)
           .rect(leftMargin, currentY, tableWidth, rowHeight)
           .stroke();

        currentY += rowHeight;
      }

      if (productData.length > 20) {
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#718096')
           .text(`... and ${productData.length - 20} more products`, leftMargin, currentY + 5, { align: 'center', width: tableWidth });
        
        currentY += 20;
      }
    }

    // Add rep data table
    if (repData && Array.isArray(repData) && repData.length > 0) {
      if (currentY + 200 > doc.page.height) {
        doc.addPage();
        doc.lineWidth(2)
           .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
           .stroke('#3182ce');
        currentY = 50;
      } else {
        currentY += 30;
      }

      doc.rect(40, currentY, doc.page.width - 80, 30)
         .fillAndStroke('#3182ce', '#3182ce');

      doc.fillColor('#ffffff')
         .font('Helvetica')
         .fontSize(14)
         .text('Rep-wise Product Sales', (doc.page.width) / 2, currentY + 8, { align: 'center' });

      currentY += 40;

      const repColumns = [
        { header: 'Rep Name', width: 120 },
        { header: 'Product Name', width: 150 },
        { header: 'Quantity', width: 80 },
        { header: 'Sales Value', width: 100 }
      ];

      const repTableWidth = repColumns.reduce((sum, col) => sum + col.width, 0);
      const repLeftMargin = (doc.page.width - repTableWidth) / 2;

      doc.fillColor('#f2f2f2')
         .rect(repLeftMargin, currentY, repTableWidth, 25)
         .fill();

      doc.fillColor('#000000')
         .font('Helvetica')
         .fontSize(10);

      let xPos = repLeftMargin;
      repColumns.forEach(column => {
        doc.text(
          column.header,
          xPos + 5,
          currentY + 8,
          { width: column.width - 10, align: 'center' }
        );
        xPos += column.width;
      });

      doc.lineWidth(1)
         .rect(repLeftMargin, currentY, repTableWidth, 25)
         .stroke();

      currentY += 25;

      const maxRepRows = Math.min(repData.length, 15);
      for (let i = 0; i < maxRepRows; i++) {
        const item = repData[i];
        const rowHeight = 20;

        if (i % 2 === 1) {
          doc.fillColor('#f9f9f9')
             .rect(repLeftMargin, currentY, repTableWidth, rowHeight)
             .fill();
        }

        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#2d3748');

        xPos = repLeftMargin;

        doc.text(item.repName || 'Unknown', xPos + 5, currentY + 6, { width: repColumns[0].width - 10, align: 'left' });
        xPos += repColumns[0].width;

        doc.text(item.productName || 'Unknown', xPos + 5, currentY + 6, { width: repColumns[1].width - 10, align: 'left' });
        xPos += repColumns[1].width;

        doc.text(String(item.totalQuantity || '0'), xPos + 5, currentY + 6, { width: repColumns[2].width - 10, align: 'center' });
        xPos += repColumns[2].width;

        doc.text(String(item.totalSalesValue || '0.00'), xPos + 5, currentY + 6, { width: repColumns[3].width - 10, align: 'center' });

        doc.lineWidth(0.5)
           .rect(repLeftMargin, currentY, repTableWidth, rowHeight)
           .stroke();

        currentY += rowHeight;
      }

      if (repData.length > 15) {
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#718096')
           .text(`... and ${repData.length - 15} more entries`, repLeftMargin, currentY + 5, { align: 'center', width: repTableWidth });
      }
    }

    // Add footer
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#718096')
       .text(
         `Generated on: ${new Date().toLocaleString()} | Ram Medical Product Sales Report`,
         doc.page.width / 2,
         doc.page.height - 40,
         { align: 'center' }
       );

    doc.end();
  } catch (error) {
    console.error('Error in PDF generation route:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: error.message
      });
    }
  }
});

module.exports = router;