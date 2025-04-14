// RCart.js
import React, { useEffect, useState } from 'react';
import './RCart.css';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";

const RCart = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/cart')
      .then(res => res.json())
      .then(data => setCartItems(data));
  }, []);

  return (
    <div className="rcart-wrapper">
      <RSidebar />
      <div className="rcart-main">
        <RNavbar />

        <div className="cart-container">
          <h2>Cart</h2>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.ProductID}>
                  <td>{item.Name}</td>
                  <td>{item.Price}</td>
                  <td>{item.Quantity}</td>
                  <td>{item.Price * item.Quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RCart;