const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// GET /api/reports/pharmacy-sales-report
router.get('/pharmacy-sales-report', (req, res) => {
  const { startDate, endDate, pharmacy_name } = req.query;

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

    // Validate date range
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

  // Base SQL query for summary
  let summarySQL = `
    SELECT 
      pharmacy_name,
      COUNT(*) as totalOrders,
      SUM(total_value) as totalSales,
      AVG(total_value) as avgOrderValue,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmedOrders
    FROM pending_orders
  `;
  const summaryParams = [];

  // Base SQL query for details
  let detailsSQL = `
    SELECT 
      pharmacy_name,
      orderId,
      rep_name,
      total_value,
      order_date,
      status,
      UserID
    FROM pending_orders
  `;
  const detailsParams = [];

  // Add WHERE clauses for filtering
  const conditions = [];
  if (startDate && endDate) {
    conditions.push(`order_date BETWEEN ? AND ?`);
    summaryParams.push(startDate, endDate);
    detailsParams.push(startDate, endDate);
  }
  if (pharmacy_name) {
    conditions.push(`pharmacy_name = ?`);
    summaryParams.push(pharmacy_name);
    detailsParams.push(pharmacy_name);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`;
    summarySQL += whereClause;
    detailsSQL += whereClause;
  }

  // Group and order for summary
  summarySQL += ` GROUP BY pharmacy_name ORDER BY totalSales DESC`;

  // Order for details
  detailsSQL += ` ORDER BY pharmacy_name, order_date DESC`;

  console.log('Executing summary SQL:', summarySQL, 'with params:', summaryParams);
  console.log('Executing details SQL:', detailsSQL, 'with params:', detailsParams);

  // Execute summary query
  db.query(summarySQL, summaryParams, (summaryErr, summaryResults) => {
    if (summaryErr) {
      console.error('Error fetching summary:', summaryErr.message, 'SQL:', summarySQL, 'Params:', summaryParams);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pharmacy sales report summary',
        error: summaryErr.message
      });
    }

    // Execute details query
    db.query(detailsSQL, detailsParams, (detailsErr, detailsResults) => {
      if (detailsErr) {
        console.error('Error fetching details:', detailsErr.message, 'SQL:', detailsSQL, 'Params:', detailsParams);
        return res.status(500).json({
          success: false,
          message: 'Error fetching pharmacy sales report details',
          error: detailsErr.message
        });
      }

      // Process summary data
      const summaryData = summaryResults.map(row => ({
        pharmacy_name: row.pharmacy_name,
        totalOrders: row.totalOrders,
        totalSales: parseFloat(row.totalSales).toFixed(2),
        avgOrderValue: parseFloat(row.avgOrderValue).toFixed(2),
        confirmedPercentage: row.totalOrders > 0 
          ? ((row.confirmedOrders / row.totalOrders) * 100).toFixed(2) + '%' 
          : '0.00%'
      }));

      // Process details data
      const detailsData = detailsResults.map(row => ({
        pharmacy_name: row.pharmacy_name,
        orderId: row.orderId,
        repName: row.rep_name,
        totalValue: parseFloat(row.total_value).toFixed(2),
        orderDate: row.order_date instanceof Date 
          ? row.order_date.toISOString().split('T')[0] 
          : row.order_date,
        status: row.status,
        userId: row.UserID
      }));

      // Response
      res.json({
        success: true,
        data: {
          summary: summaryData,
          details: detailsData
        }
      });
    });
  });
});

// POST /api/reports/pharmacy-sales-report/pdf
router.post('/pharmacy-sales-report/pdf', (req, res) => {
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
    res.setHeader('Content-Disposition', `attachment; filename=ram_medical_pharmacy_sales_report.pdf`);
    
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
      { header: 'Pharmacy Name', width: 100, property: 'pharmacy_name' },
      { header: 'Order ID', width: 60, property: 'orderId' },
      { header: 'Rep Name', width: 80, property: 'repName' },
      { header: 'Total Value', width: 60, property: 'totalValue' },
      { header: 'Order Date', width: 70, property: 'orderDate' },
      { header: 'Status', width: 60, property: 'status' },
      { header: 'User ID', width: 60, property: 'userId' }
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
    
    if (filters.startDate || filters.endDate || filters.pharmacy_name) {
      filterText = '';
      if (filters.startDate) filterText += `Start: ${filters.startDate}  `;
      if (filters.endDate) filterText += `End: ${filters.endDate}  `;
      if (filters.pharmacy_name) filterText += `Pharmacy: ${filters.pharmacy_name}`;
    }
    
    doc.font('Helvetica')
       .fontSize(10)
       .text(filterText, 100, currentY + 10, { width: doc.page.width - 160 });
    
    doc.restore();
    
    currentY += 70;
    
    // Add summary section with dynamically sized box
    let summaryData = [];
    let summaryHeight = 0;
    const baseHeight = 40; // Base height for title and padding
    const rowHeight = 35; // Height per row (label + value + spacing)
    let rows = 0;
    
    if (filters.pharmacy_name) {
      summaryData = [
        { label: 'Total Orders', value: summary.totalOrders || '0' },
        { label: 'Total Sales', value: summary.totalSales ? `$${parseFloat(summary.totalSales).toFixed(2)}` : '$0.00' },
        { label: 'Avg Order Value', value: summary.avgOrderValue ? `$${parseFloat(summary.avgOrderValue).toFixed(2)}` : '$0.00' },
        { label: 'Confirmed Percentage', value: summary.confirmedPercentage || '0.00%' }
      ];
      rows = 2; // 2x2 grid (4 items)
    } else {
      summaryData = summary.map(item => ({
        label: item.pharmacy_name,
        value: item.totalSales ? `$${parseFloat(item.totalSales).toFixed(2)}` : '$0.00'
      }));
      rows = Math.ceil(summaryData.length / 3); // Up to 3 columns
    }
    
    // Calculate total height for the summary section
    summaryHeight = baseHeight + (rows * rowHeight);
    
    // Check if summary section exceeds page height
    if (currentY + summaryHeight > doc.page.height - 50) {
      console.log('Adding new page for summary section');
      doc.addPage({ margin: 30 });
      drawPageBorder();
      drawHeader();
      currentY = 120;
    }
    
    // Draw the summary container with dynamic height
    doc.save()
       .rect(40, currentY, doc.page.width - 80, summaryHeight)
       .fillAndStroke('#f9f9f9', '#3182ce');
    
    doc.fillColor('#2d3748')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Sales Summary:', 50, currentY + 10);
    
    const summaryColWidth = (doc.page.width - 100) / (filters.pharmacy_name ? 2 : 3);
    
    summaryData.forEach((item, index) => {
      const xPos = 50 + (index % (filters.pharmacy_name ? 2 : 3) * summaryColWidth);
      const yPos = currentY + 30 + Math.floor(index / (filters.pharmacy_name ? 2 : 3)) * rowHeight;
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#4a5568')
         .text(item.label, xPos, yPos);
      
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#2c5282')
         .text(item.value, xPos, yPos + 15);
    });
    
    doc.restore();
    
    // Update currentY based on the dynamic height
    currentY += summaryHeight + 20;
    
    // Add chart with styled container
    if (charts && (charts.barChart || charts.pieChart)) {
      // Check if chart exceeds page height
      if (currentY + 220 > doc.page.height - 50) {
        console.log('Adding new page for chart section');
        doc.addPage({ margin: 30 });
        drawPageBorder();
        drawHeader();
        currentY = 120;
      }
      
      doc.save()
         .rect(40, currentY, doc.page.width - 80, 220)
         .fillAndStroke('#ffffff', '#3182ce');
      
      doc.fillColor('#2d3748')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text(filters.pharmacy_name ? `Order Status - ${filters.pharmacy_name}` : 'Sales by Pharmacy', 50, currentY + 10);
      
      try {
        if (charts.pieChart && filters.pharmacy_name) {
          // Pie chart for selected pharmacy
          doc.image(Buffer.from(charts.pieChart.split(',')[1], 'base64'), {
            x: (doc.page.width - 200) / 2,
            y: currentY + 30,
            fit: [200, 170],
            align: 'center'
          });
        } else if (charts.barChart && !filters.pharmacy_name) {
          // Bar chart for all pharmacies
          doc.image(Buffer.from(charts.barChart.split(',')[1], 'base64'), {
            x: (doc.page.width - 400) / 2,
            y: currentY + 30,
            fit: [400, 170],
            align: 'center'
          });
        }
      } catch (err) {
        console.error('Error adding chart to PDF:', err);
      }
      
      doc.restore();
      
      currentY += 240;
    }
    
    // Add table data section with styled container
    // Check if table header exceeds page height
    if (currentY + 30 > doc.page.height - 50) {
      console.log('Adding new page for table header');
      doc.addPage({ margin: 30 });
      drawPageBorder();
      drawHeader();
      currentY = 120;
    }
    
    doc.save()
       .rect(40, currentY, doc.page.width - 80, 30)
       .fillAndStroke('#3182ce', '#3182ce');
    
    doc.fillColor('#ffffff')
       .font('Helvetica-Bold')
       .fontSize(14)
       .text('Order Details', (doc.page.width) / 2, currentY + 8, { align: 'center' });
    
    doc.restore();
    
    currentY += 40;
    
    // Draw table headers for the first page
    currentY = drawTableHeaders(currentY);
    
    // Add table rows with pagination
    if (tableData && tableData.length > 0) {
      tableData.forEach((item, i) => {
        // Check if we need a new page
        if (currentY + 22 > doc.page.height - 50) { // 50 is margin for footer
          console.log(`Adding new page for table row ${i + 1}`);
          doc.addPage({ margin: 30 });
          drawPageBorder();
          drawHeader();
          currentY = 120; // Reset to header bottom
          currentY = drawTableHeaders(currentY);
        }
        
        // Draw the row
        currentY = drawTableRow(item, currentY, i % 2 === 1);
      });
    } else {
      if (currentY + 40 > doc.page.height - 50) {
        console.log('Adding new page for "No data available" message');
        doc.addPage({ margin: 30 });
        drawPageBorder();
        drawHeader();
        currentY = 120;
      }
      doc.save()
         .font('Helvetica-Oblique')
         .fontSize(12)
         .fillColor('#718096')
         .text('No data available', doc.page.width / 2, currentY + 20, { align: 'center' })
         .restore();
      currentY += 40; // Move past "No data available" text
    }
    
    // Ensure there's enough space for the footer
    if (currentY + 20 > doc.page.height - 50) {
      console.log('Adding new page for footer');
      doc.addPage({ margin: 30 });
      drawPageBorder();
      drawHeader();
      currentY = 120;
    }
    
    // Add footer on the last page with content
    doc.save()
       .font('Helvetica')
       .fontSize(8)
       .fillColor('#718096')
       .text(
         `Generated on: ${new Date().toLocaleString()} | Ram Medical Pharmacy Sales Report`,
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
    } else {
      console.error('Headers already sent, cannot send error response');
    }
  }
});

module.exports = router;