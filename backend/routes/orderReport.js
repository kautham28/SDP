const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// GET /api/reports/order-report/summary (Route for Order Report Summary - pending_orders Table)
router.get('/order-report/summary', (req, res) => {
    const { startDate, endDate } = req.query;

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

    // Base SQL query
    let ordersSQL = `
        SELECT 
            status,
            total_value
        FROM pending_orders
    `;

    const params = [];

    // Add date filter if provided
    if (startDate && endDate) {
        ordersSQL += ` WHERE order_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    console.log('Executing SQL query for summary:', ordersSQL, 'with params:', params);

    db.query(ordersSQL, params, (err, orders) => {
        if (err) {
            console.error('Error fetching orders for summary:', err.message, 'SQL:', ordersSQL, 'Params:', params);
            return res.status(500).json({
                success: false,
                message: 'Error fetching order report summary',
                error: err.message
            });
        }

        console.log('Fetched orders for summary:', orders.length);

        // Handle empty results
        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: startDate && endDate 
                    ? 'No orders found for the given date range.'
                    : 'No orders found.',
                data: {
                    totalOrders: 0,
                    pendingOrdersCount: 0,
                    confirmedOrdersCount: 0,
                    totalOrderValue: 0.00,
                    confirmedPercentage: "0.00%"
                }
            });
        }

        // Calculate totals
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending');
        const confirmedOrders = orders.filter(o => o.status.toLowerCase() === 'confirmed');
        const totalOrderValue = orders.reduce((sum, order) => sum + parseFloat(order.total_value || 0), 0).toFixed(2);
        const confirmedPercentage = totalOrders > 0 
            ? ((confirmedOrders.length / totalOrders) * 100).toFixed(2) 
            : 0;

        // Response object
        const summary = {
            totalOrders: totalOrders,
            pendingOrdersCount: pendingOrders.length,
            confirmedOrdersCount: confirmedOrders.length,
            totalOrderValue: parseFloat(totalOrderValue),
            confirmedPercentage: `${confirmedPercentage}%`
        };

        console.log('Sending summary response:', summary);

        res.json({
            success: true,
            data: summary
        });
    });
});

// GET /api/reports/order-report/details (Route for Order Report Details - pending_orders Table)
router.get('/order-report/details', (req, res) => {
    const { startDate, endDate } = req.query;

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

    // Base SQL query
    let ordersSQL = `
        SELECT 
            orderId,
            pharmacy_name,
            rep_name,
            total_value,
            order_date,
            UserID,
            status
        FROM pending_orders
    `;

    const params = [];

    // Add date filter if provided
    if (startDate && endDate) {
        ordersSQL += ` WHERE order_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    console.log('Executing SQL query for details:', ordersSQL, 'with params:', params);

    db.query(ordersSQL, params, (err, orders) => {
        if (err) {
            console.error('Error fetching orders for details:', err.message, 'SQL:', ordersSQL, 'Params:', params);
            return res.status(500).json({
                success: false,
                message: 'Error fetching order report details',
                error: err.message
            });
        }

        console.log('Fetched orders for details:', orders.length);

        // Handle empty results
        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: startDate && endDate 
                    ? 'No orders found for the given date range.'
                    : 'No orders found.',
                data: {
                    orders: []
                }
            });
        }

        // Response object
        const details = {
            orders: orders.map(order => ({
                orderId: order.orderId,
                pharmacyName: order.pharmacy_name,
                repName: order.rep_name,
                totalValue: parseFloat(order.total_value).toFixed(2),
                orderDate: order.order_date instanceof Date 
                    ? order.order_date.toISOString().split('T')[0] 
                    : order.order_date,
                userId: order.UserID,
                status: order.status || 'pending'
            }))
        };

        console.log('Sending details response:', { orderCount: details.orders.length });

        res.json({
            success: true,
            data: details
        });
    });
});

// POST /api/reports/order-report/pdf
router.post('/order-report/pdf', (req, res) => {
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
    res.setHeader('Content-Disposition', `attachment; filename=ram_medical_order_summary_report.pdf`);
    
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
      { header: 'Order ID', width: 60, property: 'orderId' },
      { header: 'Pharmacy Name', width: 100, property: 'pharmacyName' },
      { header: 'Rep Name', width: 80, property: 'repName' },
      { header: 'Total Value', width: 60, property: 'totalValue' },
      { header: 'Order Date', width: 70, property: 'orderDate' },
      { header: 'User ID', width: 60, property: 'userId' },
      { header: 'Status', width: 60, property: 'status' }
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
    
    if (filters.startDate || filters.endDate) {
      filterText = '';
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
       .rect(40, currentY, doc.page.width - 80, 80)
       .fillAndStroke('#f9f9f9', '#3182ce');
    
    doc.fillColor('#2d3748')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Order Summary:', 50, currentY + 10);
    
    // Create a grid for summary data
    const summaryData = [
      { label: 'Total Orders', value: summary.totalOrders || '0' },
      { label: 'Pending Orders', value: summary.pendingOrdersCount || '0' },
      { label: 'Confirmed Orders', value: summary.confirmedOrdersCount || '0' },
      { label: 'Total Value', value: summary.totalOrderValue ? `$${parseFloat(summary.totalOrderValue).toFixed(2)}` : '$0.00' },
      { label: 'Confirmed Percentage', value: summary.confirmedPercentage || '0.00%' }
    ];
    
    const summaryColWidth = (doc.page.width - 100) / 3;
    
    summaryData.forEach((item, index) => {
      const xPos = 50 + (index % 3 * summaryColWidth);
      const yPos = currentY + 30 + Math.floor(index / 3) * 25;
      
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
    
    currentY += 100;
    
    // Add chart with styled container
    if (charts && charts.pieChart) {
      doc.save()
         .rect(40, currentY, doc.page.width - 80, 220)
         .fillAndStroke('#ffffff', '#3182ce');
      
      doc.fillColor('#2d3748')
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('Order Status Distribution:', 50, currentY + 10);
      
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
      
      doc.restore();
      
      currentY += 240;
    }
    
    // Add table data section with styled container
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
         `Generated on: ${new Date().toLocaleString()} | Ram Medical Order Summary Report`,
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