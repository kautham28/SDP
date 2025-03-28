import React, { useEffect, useState } from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import axios from 'axios';
import './RInventory.css';

const RInventory = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products from the API
    axios.get("http://localhost:5000/api/admin/products/report")
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error("Error fetching products:", error);
      });
  }, []);

  return (
    <div className="inventory-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        
        <h1>Inventory table</h1>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Medicine Name</th>
              <th>Generic Name</th>
              <th>Expiry Date</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map(product => (
                <tr key={product.ProductID}>
                  <td>{product.ProductID}</td>
                  <td>{product.MedicineName}</td>
                  <td>{product.GenericName}</td>
                  <td>{product.ExpiryDate}</td>
                  <td>{product.UnitPrice}</td>
                  <td>{product.Quantity}</td>
                  <td>{product.TotalPrice}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RInventory;
