const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure transporter (consider moving this to a separate config file)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// POST /api/email/send-order-confirmation
router.post('/send-order-confirmation', async (req, res) => {
  const { 
    orderId, 
    pharmacyEmail, 
    repEmail, 
    pharmacyName, 
    repName, 
    orderDetails
  } = req.body;
  
  // Validate request
  if (!orderId || !pharmacyEmail || !repEmail || !pharmacyName || !repName || !orderDetails) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      received: { orderId, pharmacyEmail, repEmail, pharmacyName, repName, orderDetails: orderDetails ? 'present' : 'missing' }
    });
  }

  try {
    // Format the order details for email
    const formattedOrderDetails = orderDetails.map(item => ({
      product_name: item.product_name,
      quantity: item.quantity,
      total_price: parseFloat(item.total_price || 0)
    }));
    
    // Calculate total
    const totalOrderValue = formattedOrderDetails.reduce((sum, item) => sum + item.total_price, 0);

    // Email to pharmacy
    const pharmacyMailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourpharmacyapp.com',
      to: pharmacyEmail,
      subject: `Order #${orderId} Confirmation`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Dear ${pharmacyName},</p>
        <p>Your order #${orderId} has been confirmed and is now being processed.</p>
        <p>Thank you for your business!</p>
        <h3>Order Details:</h3>
        <ul>
          ${formattedOrderDetails.map(item => 
            `<li>${item.product_name} - Quantity: ${item.quantity} - ${item.total_price.toFixed(2)}</li>`
          ).join('')}
        </ul>
        <p><strong>Total Order Value:</strong> ${totalOrderValue.toFixed(2)}</p>
      `
    };

    // Email to rep
    const repMailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourpharmacyapp.com',
      to: repEmail,
      subject: `Order #${orderId} from ${pharmacyName} Confirmed`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Dear ${repName},</p>
        <p>The order #${orderId} from ${pharmacyName} has been confirmed.</p>
        <h3>Order Details:</h3>
        <ul>
          ${formattedOrderDetails.map(item => 
            `<li>${item.product_name} - Quantity: ${item.quantity} - ${item.total_price.toFixed(2)}</li>`
          ).join('')}
        </ul>
        <p><strong>Total Order Value:</strong> ${totalOrderValue.toFixed(2)}</p>
      `
    };

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail(pharmacyMailOptions),
      transporter.sendMail(repMailOptions)
    ]);

    res.status(200).json({ 
      message: 'Confirmation emails sent successfully',
      recipients: {
        pharmacy: pharmacyEmail,
        rep: repEmail
      }
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      message: 'Failed to send confirmation emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;