const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// GET /api/reports/expiry-goods-report
router.get('/expiry-goods-report', (req, res) => {
  const { startDate, endDate, supplierName } = req.query;

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
    if (start > end) {
      console.error('Start date is after end date:', { startDate, endDate });
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date.',
        error: 'Invalid date range'
      });
    }
  }

  // Base SQL query
  let sql = `
    SELECT 
      ProductID,
      Name,
      BatchNumber,
      ExpiryDate,
      Quantity,
      UnitPrice,
      TotalPrice,
      SupplierName,
      DATEDIFF(ExpiryDate, CURDATE()) as daysUntilExpiry
    FROM products
  `;
  const params = [];

  // Add WHERE clauses for filtering
  const conditions = [];
  if (startDate && endDate) {
    conditions.push(`ExpiryDate BETWEEN ? AND ?`);
    params.push(startDate, endDate);
  }
  if (supplierName) {
    conditions.push(`SupplierName = ?`);
    params.push(supplierName);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`;
    sql += whereClause;
  }

  // Order by expiry date
  sql += ` ORDER BY ExpiryDate ASC`;

  console.log('Executing SQL:', sql, 'with params:', params);

  // Execute query
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching expiry goods report:', err.message, 'SQL:', sql, 'Params:', params);
      return res.status(500).json({
        success: false,
        message: 'Error fetching expiry goods report',
        error: err.message
      });
    }

    // Process results
    const reportData = results.map(row => ({
      productId: row.ProductID,
      name: row.Name,
      batchNumber: row.BatchNumber || 'N/A',
      expiryDate: row.ExpiryDate instanceof Date 
        ? row.ExpiryDate.toISOString().split('T')[0] 
        : row.ExpiryDate,
      quantity: row.Quantity,
      unitPrice: parseFloat(row.UnitPrice).toFixed(2),
      totalPrice: parseFloat(row.TotalPrice).toFixed(2),
      supplierName: row.SupplierName || 'N/A',
      daysUntilExpiry: row.daysUntilExpiry,
      status: row.daysUntilExpiry < 0 ? 'Expired' : 
              row.daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Valid'
    }));

    res.json({
      success: true,
      data: reportData
    });
  });
});

// POST /api/reports/expiry-goods-pdf
router.post('/expiry-goods-pdf', (req, res) => {
  const { reportType, filters, summary, tableData, charts } = req.body;

  // Validate request body
  if (!reportType || !filters || !summary || !tableData) {
    console.error('Missing required fields in request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: reportType, filters, summary, or tableData'
    });
  }

  console.log(`Received tableData with ${tableData.length} rows`);

  try {
    // Create a new PDF document
    const doc = new PDFDocument({ 
      margin: 30, 
      bufferPages: true,
      size: 'A4',
      layout: 'portrait',
      autoFirstPage: false
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ram_medical_expiry_goods_report.pdf`);
    
    // Pipe the PDF document to the response
    doc.pipe(res);
    
    // Add first page with custom options
    doc.addPage({
      margin: 30
    });
    
    // Load logo (assuming you have a logo file in your project)
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
    const drawPageBorder = () => {
      doc.save()
         .lineWidth(2)
         .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .stroke('#3182ce')
         .restore();
    };
    
    // Draw header with logo
    const drawHeader = () => {
      // Draw header background
      doc.save()
         .fillColor('#f0f8ff')
         .rect(20, 20, doc.page.width - 40, 80)
         .fill()
         .restore();
      
      // Add logo if available
      if (logoImage) {
        doc.image(logoImage, 40, 30, { width: 60 });
      }
      
      // Add company name
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#2c5282')
         .text('RAM MEDICAL', logoImage ? 110 : 40, 40);
      
      // Add report title
      doc.font('Helvetica')
         .fontSize(14)
         .fillColor('#4a5568')
         .text(reportType, logoImage ? 110 : 40, 70);
      
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
    };
    
    // Define column widths for table layout
    const columns = [
      { header: 'Product ID', width: 50, property: 'productId' },
      { header: 'Name', width: 80, property: 'name' },
      { header: 'Batch', width: 50, property: 'batchNumber' },
      { header: 'Expiry Date', width: 70, property: 'expiryDate' },
      { header: 'Quantity', width: 50, property: 'quantity' },
      { header: 'Unit Price', width: 50, property: 'unitPrice' },
      { header: 'Total Price', width: 50, property: 'totalPrice' },
      { header: 'Supplier', width: 70, property: 'supplierName' },
      { header: 'Days to Expiry', width: 50, property: 'daysUntilExpiry' },
      { header: 'Status', width: 50, property: 'status' }
    ];
    
    // Calculate total table width
    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    
    // Calculate left margin to center the table
    const leftMargin = (doc.page.width - tableWidth) / 2;
    
    // Function to draw table headers
    const drawTableHeaders = (y) => {
      // Draw header background
      doc.save()
         .fillColor('#2c5282')
         .rect(leftMargin, y, tableWidth, 25)
         .fill()
         .restore();
      
      // Draw header text
      doc.save()
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(8);
      
      let xPos = leftMargin;
      columns.forEach(column => {
        doc.text(
          column.header,
          xPos + 5,
          y + 8,
          { width: column.width - 10, align: 'center' }
        );
        xPos += column.width;
      });
      
      doc.restore();
      
      return y + 25; // Return position after headers
    };
    
    // Function to draw a table row
    const drawTableRow = (item, y, isAlternate) => {
      const rowHeight = 22;
      
      // Draw row background for alternate rows
      if (isAlternate) {
        doc.save()
           .fillColor('#f7fafc')
           .rect(leftMargin, y, tableWidth, rowHeight)
           .fill()
           .restore();
      }
      
      // Draw row data
      doc.save()
         .font('Helvetica')
         .fontSize(7)
         .fillColor('#2d3748');
      
      let xPos = leftMargin;
      
      columns.forEach(column => {
        doc.text(
          item[column.property] || '',
          xPos + 5,
          y + 6,
          { width: column.width - 10, align: 'center' }
        );
        xPos += column.width;
      });
      
      doc.restore();
      
      // Draw row bottom border
      doc.save()
         .strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .moveTo(leftMargin, y + rowHeight)
         .lineTo(leftMargin + tableWidth, y + rowHeight)
         .stroke()
         .restore();
      
      return y + rowHeight; // Return position after row
    };
    
    // Draw page border
    drawPageBorder();
    
    // Draw header
    drawHeader();
    
    // Current Y position after header
    let currentY = 120;
    
    // Add filters section with styled box
    doc.save()
       .rect(40, currentY, doc.page.width - 80, 50)
       .fillAndStroke('#f0f8ff', '#3182ce');
    
    doc.fillColor('#2d3748')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Filters:', 50, currentY + 10);
    
    let filterText = 'None';
    
    if (filters.startDate || filters.endDate || filters.supplierName) {
      filterText = '';
      if (filters.startDate) filterText += `Start: ${filters.startDate}  `;
      if (filters.endDate) filterText += `End: ${filters.endDate}  `;
      if (filters.supplierName) filterText += `Supplier: ${filters.supplierName}`;
    }
    
    doc.font('Helvetica')
       .fontSize(10)
       .text(filterText, 100, currentY + 10, { width: doc.page.width - 160 });
    
    doc.restore();
    
    currentY += 70;
    
    // Add summary section with styled box
    doc.save()
       .rect(40, currentY, doc.page.width - 80, 60)
       .fillAndStroke('#f9f9f9', '#3182ce');
    
    doc.fillColor('#2d3748')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Expiry Summary:', 50, currentY + 10);
    
    // Create a grid for summary data
    const summaryData = [
      { label: 'Expired Quantity', value: summary.totalExpiredQuantity || '0' },
      { label: 'Expiring Soon Qty', value: summary.totalExpiringSoonQuantity || '0' },
      { label: 'Value at Risk', value: summary.totalValueAtRisk || '0.00' }
    ];
    
    const summaryColWidth = (doc.page.width - 100) / 3;
    
    summaryData.forEach((item, index) => {
      const xPos = 50 + (index * summaryColWidth);
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#4a5568')
         .text(item.label, xPos, currentY + 30);
      
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#2c5282')
         .text(item.value, xPos, currentY + 30 + 15);
    });
    
    doc.restore();
    
    currentY += 80;
    
    // Add charts with styled container
    if (charts && (charts.barChart || charts.pieChart)) {
      doc.save()
         .rect(40, currentY, doc.page.width - 80, 220)
         .fillAndStroke('#ffffff', '#3182ce');
      
      doc.fillColor('#2d3748')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('Expiry Charts:', 50, currentY + 10);
      
      doc.restore();
      
      // Center the charts
      if (charts.barChart && charts.pieChart) {
        // If both charts are available, place them side by side
        try {
          // Bar chart (left)
          doc.image(Buffer.from(charts.barChart.split(',')[1], 'base64'), {
            x: 60,
            y: currentY + 30,
            fit: [doc.page.width / 2 - 80, 170],
            align: 'center'
          });
          
          // Pie chart (right)
          doc.image(Buffer.from(charts.pieChart.split(',')[1], 'base64'), {
            x: doc.page.width / 2 + 20,
            y: currentY + 30,
            fit: [doc.page.width / 2 - 80, 170],
            align: 'center'
          });
        } catch (err) {
          console.error('Error adding charts to PDF:', err);
        }
      } else if (charts.barChart) {
        // Only bar chart
        try {
          doc.image(Buffer.from(charts.barChart.split(',')[1], 'base64'), {
            x: (doc.page.width - 400) / 2,
            y: currentY + 30,
            fit: [400, 170],
            align: 'center'
          });
        } catch (err) {
          console.error('Error adding bar chart to PDF:', err);
        }
      } else if (charts.pieChart) {
        // Only pie chart
        try {
          doc.image(Buffer.from(charts.pieChart.split(',')[1], 'base64'), {
            x: (doc.page.width - 200) / 2,
            y: currentY + 30,
            fit: [200, 170],
            align: 'center'
          });
        } catch (err) {
          console.error('Error adding pie chart to PDF:', err);
        }
      }
      
      currentY += 240;
    }
    
    // Add table data section with styled container
    doc.save()
       .rect(40, currentY, doc.page.width - 80, 30)
       .fillAndStroke('#3182ce', '#3182ce');
    
    doc.fillColor('#ffffff')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text('Expiry Details', (doc.page.width) / 2, currentY + 8, { align: 'center' });
    
    doc.restore();
    
    currentY += 40;
    
    // Draw table headers for the first page
    currentY = drawTableHeaders(currentY);
    
    // Add table rows with pagination
    if (tableData && tableData.length > 0) {
      tableData.forEach((item, i) => {
        // Check if we need a new page
        if (currentY + 22 > doc.page.height - 50) {
          // Add a new page
          doc.addPage({ margin: 30 });
          // Draw page border
          drawPageBorder();
          // Draw header
          drawHeader();
          // Reset currentY for table headers
          currentY = 120;
          // Draw table headers on the new page
          currentY = drawTableHeaders(currentY);
        }
        
        // Draw the row
        currentY = drawTableRow(item, currentY, i % 2 === 1);
      });
    } else {
      doc.save()
         .font('Helvetica-Oblique')
         .fontSize(12)
         .fillColor('#718096')
         .text('No data available', doc.page.width / 2, currentY + 20, { align: 'center' })
         .restore();
    }
    
    // Add footer
    doc.save()
       .font('Helvetica')
       .fontSize(8)
       .fillColor('#718096')
       .text(
         `Generated on: ${new Date().toLocaleString()} | Ram Medical Expiry Goods Report`,
         doc.page.width / 2,
         doc.page.height - 40,
         { align: 'center' }
       )
       .restore();
    
    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: err.message
      });
    }
  }
});

module.exports = router;