import React, { useEffect, useState } from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import axios from 'axios';
import './RInventory.css';

const RInventory = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    axios.get("http://localhost:5000/api/admin/products/report")
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error("Error fetching products:", error);
      });
  }, []);

  const filteredProducts = products.filter(product =>
    product.MedicineName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="r-inventory-wrapper">
      <RNavbar />
      <RSidebar />
      <div className="r-inventory-main-section">
        <h1>Inventory table</h1>
        <input
          type="text"
          placeholder="Filter by Medicine Name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginBottom: '20px', padding: '5px', width: '200px' }}
        />
        <div className="r-inventory-table-wrapper">
          <table className="r-inventory-data-table">
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.ProductID}>
                    <td>{product.ProductID}</td>
                    <td>{product.MedicineName}</td>
                    <td>{product.GenericName}</td>
                    <td>{new Date(product.ExpiryDate).toLocaleDateString()}</td>
                    <td>{Number(product.UnitPrice).toFixed(2)}</td>
                    <td>{product.Quantity}</td>
                    <td>{Number(product.TotalPrice).toFixed(2)}</td>
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
    </div>
  );
};

export default RInventory;