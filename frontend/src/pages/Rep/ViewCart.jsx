import React, { useEffect, useState } from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './ViewCart.css';
import { useNavigate } from 'react-router-dom';

const ViewCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load cart items from localStorage
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);
  }, []);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const confirmOrder = () => {
    // Confirm the order and clear the cart
    alert("Order confirmed!");
    localStorage.removeItem("cart");
    setCartItems([]); // Clear the state as well
    navigate('/rep/make-order'); // Redirect to the make order page
  };

  const continueShopping = () => {
    navigate('/rep/make-order'); // Redirect to the make order page
  };

  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Your Cart</h1>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.Name}</td>
                    <td>Rs. {item.UnitPrice}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {item.UnitPrice * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-summary">
              <h3>Total Amount: Rs. {calculateTotal()}</h3>
              <div className="cart-buttons">
                <button onClick={confirmOrder}>Confirm Order</button>
                <button onClick={continueShopping}>Continue Shopping</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewCart;
