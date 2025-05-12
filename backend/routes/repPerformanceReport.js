const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// GET /api/reports/rep-performance-report
router.get('/rep-performance-report', (req, res) => {
  const { repId, month, year, startDate, endDate } = req.query;

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
      ra.RepID,
      ra.Month,
      ra.Year,
      ra.Target,
      ra.TotalSales,
      ra.Percentage,
      COALESCE(SUM(co.TotalValue), 0) as confirmedSales,
      (ra.TotalSales - COALESCE(SUM(co.TotalValue), 0)) as salesDifference
    FROM rep_achievements ra
    LEFT JOIN confirmed_order co ON ra.RepID = co.UserID AND co.OrderDate BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()
    WHERE 1=1
  `;
  const params = [];

  // Add WHERE clauses for filtering
  if (repId) {
    sql += ` AND ra.RepID = ?`;
    params.push(repId);
  }
  if (month) {
    sql += ` AND ra.Month = ?`;
    params.push(month);
  }
  if (year) {
    sql += ` AND ra.Year = ?`;
    params.push(year);
  }
  if (startDate && endDate) {
    sql += ` AND co.OrderDate BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  sql += ` GROUP BY ra.RepID, ra.Month, ra.Year, ra.Target, ra.TotalSales, ra.Percentage
           ORDER BY ra.Year DESC, ra.Month DESC, ra.TotalSales DESC`;

  console.log('Executing SQL:', sql, 'with params:', params);

  // Execute query
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching rep performance report:', err.message, 'SQL:', sql, 'Params:', params);
      return res.status(500).json({
        success: false,
        message: 'Error fetching rep performance report',
        error: err.message
      });
    }

    // Process results
    const reportData = results.map(row => ({
      repId: row.RepID,
      month: row.Month,
      year: row.Year,
      target: parseFloat(row.Target).toFixed(2),
      totalSales: parseFloat(row.TotalSales).toFixed(2),
      percentage: parseFloat(row.Percentage).toFixed(2) + '%',
      confirmedSales: parseFloat(row.confirmedSales).toFixed(2),
      salesDifference: parseFloat(row.salesDifference).toFixed(2)
    }));

    res.json({
      success: true,
      data: reportData
    });
  });
});

// POST /api/reports/generate-pdf
router.post('/generate-pdf', (req, res) => {
  const { reportType, filters, summary, tableData, charts } = req.body;
  
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
  res.setHeader('Content-Disposition', `attachment; filename=ram_medical_report.pdf`);
  
  // Pipe the PDF document to the response
  doc.pipe(res);
  
  // Add first page with custom options
  doc.addPage({
    margin: 30
  });
  
  // Load logo (assuming you have a logo file in your project)
  // You'll need to replace this path with the actual path to your logo
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
  
  // Define column widths for better table layout
  const columns = [
    { header: 'Rep ID', width: 50, property: 'repId' },
    { header: 'Month', width: 70, property: 'month' },
    { header: 'Year', width: 50, property: 'year' },
    { header: 'Target', width: 70, property: 'target' },
    { header: 'Total Sales', width: 80, property: 'totalSales' },
    { header: 'Percentage', width: 70, property: 'percentage' },
    { header: 'Confirmed', width: 80, property: 'confirmedSales' },
    { header: 'Difference', width: 70, property: 'salesDifference' }
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
       .fontSize(10);
    
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
       .fontSize(9)
       .fillColor('#2d3748');
    
    let xPos = leftMargin;
    
    columns.forEach(column => {
      doc.text(
        item[column.property],
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
  
  if (filters.repId || filters.month || filters.year || filters.startDate || filters.endDate) {
    filterText = '';
    if (filters.repId) filterText += `Rep ID: ${filters.repId}  `;
    if (filters.month) filterText += `Month: ${filters.month}  `;
    if (filters.year) filterText += `Year: ${filters.year}  `;
    if (filters.startDate) filterText += `Start: ${filters.startDate}  `;
    if (filters.endDate) filterText += `End: ${filters.endDate}`;
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
     .text('Performance Summary:', 50, currentY + 10);
  
  // Create a grid for summary data
  const summaryData = [
    { label: 'Total Target', value: summary.totalTarget },
    { label: 'Total Sales', value: summary.totalSales },
    { label: 'Confirmed Sales', value: summary.totalConfirmedSales },
    { label: 'Avg. Achievement', value: summary.avgPercentage }
  ];
  
  const summaryColWidth = (doc.page.width - 100) / 4;
  
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
       .text('Performance Charts:', 50, currentY + 10);
    
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
     .text('Performance Details', (doc.page.width) / 2, currentY + 8, { align: 'center' });
  
  doc.restore();
  
  currentY += 40;
  
  // Draw table headers
  currentY = drawTableHeaders(currentY);
  
  // Add table rows
  if (tableData && tableData.length > 0) {
    tableData.forEach((item, i) => {
      // Check if we need a new page
      if (currentY + 22 > doc.page.height - 50) {
        // We're limiting to one page as requested
        return;
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
       `Generated on: ${new Date().toLocaleString()} | Ram Medical Rep Performance Report`,
       doc.page.width / 2,
       doc.page.height - 40,
       { align: 'center' }
     )
     .restore();
  
  // Finalize the PDF
  doc.end();
});

module.exports = router;
