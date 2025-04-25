import React, { useState, useEffect } from 'react';
import './RMakeOrder.css';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import { ShoppingCart, Pencil, Trash2 } from 'lucide-react';

const RMakeOrder = () => {
  const [products, setProducts] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [repName, setRepName] = useState('');
  const [repID, setRepID] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQty, setEditedQty] = useState(1);

  useEffect(() => {
    fetch('http://localhost:5000/api/pharmacies/all-pharmacies')
      .then(res => res.json())
      .then(data => setPharmacies(data));

    fetch('http://localhost:5000/api/admin/products')
      .then(res => res.json())
      .then(data => setProducts(data));

    const fetchRepData = async () => {
      const token = sessionStorage.getItem("token");
      const userID = sessionStorage.getItem("userID");

      if (!token || !userID) return;

      try {
        const response = await fetch("http://localhost:5000/users", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        const loggedInUser = data.find(user => user.id === parseInt(userID));

        if (loggedInUser) {
          setRepName(loggedInUser.username);
          setRepID(loggedInUser.id.toString()); // Ensure repID is stored as string
        }
      } catch (error) {
        console.error("Failed to fetch rep data:", error);
      }
    };

    fetchRepData();
  }, []);

  const handlePharmacyChange = (pharmacyId) => {
    setSelectedPharmacy(pharmacyId);
  };

  const addToCart = (product) => {
    const qtyInput = document.getElementById(`qty-${product.ProductID}`);
    const quantity = parseInt(qtyInput.value);

    if (!selectedPharmacy) {
      alert("Please select a pharmacy first.");
      return;
    }

    if (!quantity || quantity <= 0 || quantity > product.Quantity) {
      alert("Invalid quantity.");
      return;
    }

    const newItem = {
      productId: product.ProductID,
      productName: product.Name,
      quantity: quantity,
      price: product.UnitPrice,
      totalPrice: product.UnitPrice * quantity
    };

    setCartItems([...cartItems, newItem]);
    alert(`${quantity} of ${product.Name} added to cart.`);
  };

  const deleteCartItem = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
  };

  const startEdit = (index, currentQty) => {
    setEditingIndex(index);
    setEditedQty(currentQty);
  };

  const saveEdit = (index) => {
    const updatedCart = [...cartItems];
    const product = updatedCart[index];

    if (editedQty <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    product.quantity = editedQty;
    product.totalPrice = product.price * editedQty;

    updatedCart[index] = product;
    setCartItems(updatedCart);
    setEditingIndex(null);
  };

  const confirmOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!repID) {
      alert("Representative ID not found. Please refresh the page.");
      return;
    }

    const pharmacyName = pharmacies.find(p => p.PharmacyID === selectedPharmacy)?.PharmacyName;
    const totalValue = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    const today = new Date().toISOString().split("T")[0];

    const orderData = {
      pharmacy_name: pharmacyName,
      rep_name: repName,
      total_value: totalValue,
      order_date: today,
      userID: repID, // Using the repID that was fetched from token
      products: cartItems.map(item => ({
        product_name: item.productName,
        unit_price: item.price,
        quantity: item.quantity,
        total_price: item.totalPrice
      }))
    };

    try {
      const response = await fetch("http://localhost:5000/api/admin/confirm-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to confirm order: ${errorText}`);
      }

      const result = await response.json();
      alert(`Order confirmed! Order ID: ${result.orderId}, Total Value: ${result.totalValue}`);
      setCartItems([]);
    } catch (error) {
      console.error("Error:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="rmakeorder-wrapper">
      <RSidebar />
      <div className="rmakeorder-main">
        <RNavbar />

        <div className="order-container">
          <div className="order-form">
            <div className="form-row">
              <label>Pharmacy:</label>
              <select onChange={e => handlePharmacyChange(e.target.value)} value={selectedPharmacy}>
                <option value="">Select Pharmacy</option>
                {pharmacies.map(p => (
                  <option key={p.PharmacyID} value={p.PharmacyID}>
                    {p.PharmacyName}
                  </option>
                ))}
              </select>

              <label>Rep Name:</label>
              <input type="text" value={repName} readOnly />

              <label>Rep ID:</label>
              <input type="text" value={repID} readOnly />
            </div>
          </div>

          <div className="order-content">
            <div className="product-section">
              <h2>Products</h2>
              <div className="product-list scroll-view">
                {products.map(product => (
                  <div className="product-card" key={product.ProductID}>
                    <img src={product.ImagePath} alt={product.Name} className="product-image" />
                    <strong>{product.Name}</strong>
                    <div className="product-details">
                      <p>Expiry: {new Date(product.ExpiryDate).toLocaleDateString()}</p>
                      <p>Rs: {product.UnitPrice}</p>
                    </div>
                    <div className="product-actions">
                      <p><strong>Stock:</strong> {product.Quantity}</p>
                      <input
                        type="number"
                        id={`qty-${product.ProductID}`}
                        defaultValue={1}
                        min={1}
                        max={product.Quantity}
                      />
                      <button onClick={() => addToCart(product)}>
                        <ShoppingCart size={24} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {cartItems.length > 0 && (
            <div className="cart-summary">
              <h3>Cart Summary</h3>
              <div className="cart-table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td>
                          {editingIndex === index ? (
                            <input
                              type="number"
                              min={1}
                              value={editedQty}
                              onChange={(e) => setEditedQty(parseInt(e.target.value))}
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td>Rs. {item.price}</td>
                        <td>Rs. {item.totalPrice}</td>
                        <td>
                          {editingIndex === index ? (
                            <button onClick={() => saveEdit(index)}>Save</button>
                          ) : (
                            <button onClick={() => startEdit(index, item.quantity)}>
                              <Pencil size={18} />
                            </button>
                          )}
                          <button onClick={() => deleteCartItem(index)}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cart-total">
                <p><strong>Total:</strong> Rs. {cartItems.reduce((total, item) => total + item.totalPrice, 0)}</p>
              </div>

              <button className="confirm-btn" onClick={confirmOrder}>Confirm Order</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RMakeOrder;