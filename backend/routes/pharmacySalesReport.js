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

  // Base SQL query for top pharmacies (top 5 by total sales)
  let topPharmaciesSQL = `
    SELECT 
      pharmacy_name,
      COUNT(*) as totalOrders,
      SUM(total_value) as totalSales,
      AVG(total_value) as avgOrderValue
    FROM pending_orders
  `;
  const topPharmaciesParams = [];

  // Add WHERE clauses for filtering
  const conditions = [];
  if (startDate && endDate) {
    conditions.push(`order_date BETWEEN ? AND ?`);
    summaryParams.push(startDate, endDate);
    detailsParams.push(startDate, endDate);
    topPharmaciesParams.push(startDate, endDate);
  }
  if (pharmacy_name) {
    conditions.push(`pharmacy_name = ?`);
    summaryParams.push(pharmacy_name);
    detailsParams.push(pharmacy_name);
    topPharmaciesParams.push(pharmacy_name);
  }

  if (conditions.length > 0) {
    const whereClause = ` WHERE ${conditions.join(' AND ')}`;
    summarySQL += whereClause;
    detailsSQL += whereClause;
    topPharmaciesSQL += whereClause;
  }

  // Group and order for summary
  summarySQL += ` GROUP BY pharmacy_name ORDER BY totalSales DESC`;

  // Order for details
  detailsSQL += ` ORDER BY pharmacy_name, order_date DESC`;

  // Group and order for top pharmacies
  topPharmaciesSQL += ` GROUP BY pharmacy_name ORDER BY totalSales DESC LIMIT 5`;

  console.log('Executing summary SQL:', summarySQL, 'with params:', summaryParams);
  console.log('Executing details SQL:', detailsSQL, 'with params:', detailsParams);
  console.log('Executing top pharmacies SQL:', topPharmaciesSQL, 'with params:', topPharmaciesParams);

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

      // Execute top pharmacies query
      db.query(topPharmaciesSQL, topPharmaciesParams, (topPharmaciesErr, topPharmaciesResults) => {
        if (topPharmaciesErr) {
          console.error('Error fetching top pharmacies:', topPharmaciesErr.message, 'SQL:', topPharmaciesSQL, 'Params:', topPharmaciesParams);
          return res.status(500).json({
            success: false,
            message: 'Error fetching top pharmacies',
            error: topPharmaciesErr.message
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

        // Process top pharmacies data
        const topPharmaciesData = topPharmaciesResults.map(row => ({
          pharmacy_name: row.pharmacy_name,
          totalOrders: row.totalOrders,
          totalSales: parseFloat(row.totalSales).toFixed(2),
          avgOrderValue: parseFloat(row.avgOrderValue).toFixed(2)
        }));

        // Response
        res.json({
          success: true,
          data: {
            summary: summaryData,
            details: detailsData,
            topPharmacies: topPharmaciesData
          }
        });
      });
    });
  });
});

// POST /api/reports/pharmacy-sales-report/pdf
router.post('/pharmacy-sales-report/pdf', (req, res) => {
  const { reportType, filters, summary, tableData, topPharmacies, charts } = req.body;

  // Validate request body
  if (!reportType || !filters || !summary || !tableData) {
    console.error('Missing required fields in request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: reportType, filters, summary, or tableData'
    });
  }

  console.log(`Received tableData with ${tableData.length} rows`);
  console.log(`Received topPharmacies with ${topPharmacies?.length || 0} rows`);

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
    const drawPageBorder = () => {
      doc.save()
         .lineWidth(2)
         .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .stroke('#3182ce')
         .restore();
    };
    
    // Draw header with logo
    const drawHeader = () => {
      doc.save()
         .fillColor('#f0f8ff')
         .rect(20, 20, doc.page.width - 40, 80)
         .fill()
         .restore();
      
      if (logoImage) {
        doc.image(logoImage, 40, 30, { width: 60 });
      }
      
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#2c5282')
         .text('RAM MEDICAL', logoImage ? 110 : 40, 40);
      
      doc.font('Helvetica')
         .fontSize(14)
         .fillColor('#4a5568')
         .text(reportType, logoImage ? 110 : 40, 70);
      
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
    
    // Define column widths for details table
    const detailColumns = [
      { header: 'Pharmacy Name', width: 100, property: 'pharmacy_name' },
      { header: 'Order ID', width: 60, property: 'orderId' },
      { header: 'Rep Name', width: 80, property: 'repName' },
      { header: 'Total Value', width: 60, property: 'totalValue' },
      { header: 'Order Date', width: 70, property: 'orderDate' },
      { header: 'Status', width: 60, property: 'status' },
      { header: 'User ID', width: 60, property: 'userId' }
    ];
    
    // Define column widths for top pharmacies table
    const topPharmacyColumns = [
      { header: 'Pharmacy Name', width: 150, property: 'pharmacy_name' },
      { header: 'Total Orders', width: 80, property: 'totalOrders' },
      { header: 'Total Sales', width: 100, property: 'totalSales' },
      { header: 'Avg Order Value', width: 100, property: 'avgOrderValue' }
    ];
    
    // Calculate total table widths
    const detailTableWidth = detailColumns.reduce((sum, col) => sum + col.width, 0);
    const topPharmacyTableWidth = topPharmacyColumns.reduce((sum, col) => sum + col.width, 0);
    
    // Calculate left margins to center tables
    const detailLeftMargin = (doc.page.width - detailTableWidth) / 2;
    const topPharmacyLeftMargin = (doc.page.width - topPharmacyTableWidth) / 2;
    
    // Function to draw table headers
    const drawTableHeaders = (y, columns, tableWidth, leftMargin) => {
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
        doc.text(
          column.header,
          xPos + 5,
          y + 8,
          { width: column.width - 10, align: 'center' }
        );
        xPos += column.width;
      });
      
      doc.restore();
      
      return y + 25;
    };
    
    // Function to draw a table row
    const drawTableRow = (item, y, isAlternate, columns, tableWidth, leftMargin) => {
      const rowHeight = 22;
      
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
        doc.text(
          item[column.property] || '',
          xPos + 5,
          y + 6,
          { width: column.width - 10, align: 'center' }
        );
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
    
    // Draw page border
    drawPageBorder();
    
    // Draw header
    drawHeader();
    
    // Current Y position after header
    let currentY = 120;
    
    // Add filters section
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
    
    // Add summary section
    let summaryData = [];
    let summaryHeight = 0;
    const baseHeight = 40;
    const rowHeight = 35;
    let rows = 0;
    
    if (filters.pharmacy_name) {
      summaryData = [
        { label: 'Total Orders', value: summary.totalOrders || '0' },
        { label: 'Total Sales', value: summary.totalSales ? `$${parseFloat(summary.totalSales).toFixed(2)}` : '$0.00' },
        { label: 'Avg Order Value', value: summary.avgOrderValue ? `$${parseFloat(summary.avgOrderValue).toFixed(2)}` : '$0.00' },
        { label: 'Confirmed Percentage', value: summary.confirmedPercentage || '0.00%' }
      ];
      rows = 2;
    } else {
      summaryData = summary.map(item => ({
        label: item.pharmacy_name,
        value: item.totalSales ? `$${parseFloat(item.totalSales).toFixed(2)}` : '$0.00'
      }));
      rows = Math.ceil(summaryData.length / 3);
    }
    
    summaryHeight = baseHeight + (rows * rowHeight);
    
    if (currentY + summaryHeight > doc.page.height - 50) {
      console.log('Adding new page for summary section');
      doc.addPage({ margin: 30 });
      drawPageBorder();
      drawHeader();
      currentY = 120;
    }
    
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
    
    currentY += summaryHeight + 20;
    
    // Add top pharmacies section
    if (topPharmacies && topPharmacies.length > 0) {
      if (currentY + 150 > doc.page.height - 50) {
        console.log('Adding new page for top pharmacies section');
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
         .text('Top Pharmacies (by Total Sales)', (doc.page.width) / 2, currentY + 8, { align: 'center' });
      
      doc.restore();
      
      currentY += 40;
      
      currentY = drawTableHeaders(currentY, topPharmacyColumns, topPharmacyTableWidth, topPharmacyLeftMargin);
      
      topPharmacies.forEach((item, i) => {
        if (currentY + 22 > doc.page.height - 50) {
          console.log(`Adding new page for top pharmacy row ${i + 1}`);
          doc.addPage({ margin: 30 });
          drawPageBorder();
          drawHeader();
          currentY = 120;
          currentY = drawTableHeaders(currentY, topPharmacyColumns, topPharmacyTableWidth, topPharmacyLeftMargin);
        }
        
        currentY = drawTableRow(item, currentY, i % 2 === 1, topPharmacyColumns, topPharmacyTableWidth, topPharmacyLeftMargin);
      });
      
      currentY += 20;
    }
    
    // Add chart section
    if (charts && (charts.barChart || charts.pieChart)) {
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
          doc.image(Buffer.from(charts.pieChart.split(',')[1], 'base64'), {
            x: (doc.page.width - 200) / 2,
            y: currentY + 30,
            fit: [200, 170],
            align: 'center'
          });
        } else if (charts.barChart && !filters.pharmacy_name) {
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
    
    // Add order details section
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
    
    currentY = drawTableHeaders(currentY, detailColumns, detailTableWidth, detailLeftMargin);
    
    if (tableData && tableData.length > 0) {
      tableData.forEach((item, i) => {
        if (currentY + 22 > doc.page.height - 50) {
          console.log(`Adding new page for table row ${i + 1}`);
          doc.addPage({ margin: 30 });
          drawPageBorder();
          drawHeader();
          currentY = 120;
          currentY = drawTableHeaders(currentY, detailColumns, detailTableWidth, detailLeftMargin);
        }
        
        currentY = drawTableRow(item, currentY, i % 2 === 1, detailColumns, detailTableWidth, detailLeftMargin);
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
      currentY += 40;
    }
    
    if (currentY + 20 > doc.page.height - 50) {
      console.log('Adding new page for footer');
      doc.addPage({ margin: 30 });
      drawPageBorder();
      drawHeader();
      currentY = 120;
    }
    
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