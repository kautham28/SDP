import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './AExpiryalert.css';
import axios from 'axios';

const AExpiryalert = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/products/expiring-soon');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching expiring products:', error);
      }
    };

    fetchExpiringProducts();
  }, []);

  const handleReturn = (productId) => {
    console.log('Return product with ID:', productId);
    // You can add logic for returning the product here
  };

  return (
    <div className="admin-layout">
      <ASidebar />
      <div className="content">
        <ANavbar />
        <div className="expiry-page-content">
          <h1 className="expiry-page-title">Expiry Alert</h1>
          <div className="expiry-search-container">
            <input type="text" className="expiry-search-input" placeholder="Search by medicine name" />
            <input type="text" className="expiry-search-input" placeholder="Search by batch number" />
            <button className="expiry-search-button">Search</button>
            <button className="expiry-report-button">Generate Report</button>
          </div>
          <table className="expiry-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Batch Number</th>
                <th>Quantity</th>
                <th>Days to Expiry</th>
                <th>Action</th> {/* Added Action column */}
              </tr>
            </thead>
            <tbody>
              {products.map((item, index) => {
                const daysToExpiry = Math.ceil((new Date(item.ExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={index} className={daysToExpiry < 30 ? 'expiry-low-stock' : ''}>
                    <td>{item.Name}</td>
                    <td>{item.BatchNumber}</td>
                    <td>{item.Quantity}</td>
                    <td className="days-to-expiry">
                      {daysToExpiry}
                    </td>
                    <td>
                      <button className="return-button" onClick={() => handleReturn(item.ID)}>Return</button> {/* Return button */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AExpiryalert;
