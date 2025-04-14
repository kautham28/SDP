const express = require("express");
const router = express.Router();
const db = require("../config/db");

// POST /api/cart/create
router.post('/create', async (req, res) => {
  const { pharmacyId, pharmacyName, repId, repName, items } = req.body;

  // Validate if items are provided
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart must contain at least one item.' });
  }

  // Step 1: Insert a new cart
  const insertCartSQL = `
    INSERT INTO cart (PharmacyID, PharmacyName, RepID, RepName, TotalValue)
    VALUES (?, ?, ?, ?, 0)
  `;

  db.query(insertCartSQL, [pharmacyId, pharmacyName, repId, repName], (err, result) => {
    if (err) {
      console.error('Error creating cart:', err.message); // Log the error with the message
      return res.status(500).json({ error: 'Failed to create cart', details: err.message });
    }

    const cartId = result.insertId;
    let totalValue = 0;

    // Step 2: Prepare insert queries for cart items
    const insertItemSQL = `
      INSERT INTO cart_items (CartID, ProductID, Quantity, Price, TotalPrice)
      VALUES (?, ?, ?, ?, ?)
    `;

    let insertCount = 0;

    items.forEach(item => {
      const total = item.price * item.quantity;
      totalValue += total;

      db.query(insertItemSQL, [cartId, item.productId, item.quantity, item.price, total], (itemErr) => {
        if (itemErr) {
          console.error('Error inserting item:', itemErr.message); // Log the error with the message
        }

        insertCount++;

        // After all items are inserted, update the total
        if (insertCount === items.length) {
          const updateTotalSQL = `UPDATE cart SET TotalValue = ? WHERE CartID = ?`;
          db.query(updateTotalSQL, [totalValue, cartId], (updateErr) => {
            if (updateErr) {
              console.error('Error updating total:', updateErr.message); // Log the error with the message
              return res.status(500).json({ error: 'Failed to update total', details: updateErr.message });
            }

            res.status(201).json({
              message: 'Cart and items added successfully',
              cartId: cartId,
              totalValue: totalValue
            });
          });
        }
      });
    });
  });
});

module.exports = router;
