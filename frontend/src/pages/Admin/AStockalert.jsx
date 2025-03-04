import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './AStockAlert.css';
import axios from 'axios';

const AStockAlertNew = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/products/low-stock');
        setStockData(response.data);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      }
    };

    fetchLowStockProducts();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search clicked:', searchQuery);
  };

  const handleGenerateReport = () => {
    console.log('Generate Report clicked');
  };

  return (
    <div className="new-stock-alert-wrapper">
      <ASidebar />
      <div className="new-stock-alert-content">
        <ANavbar />
        <div className="new-stock-alert-heading">
          <h1>Stock Alerts</h1>
        </div>
        <div className="new-stock-alert-search-section">
          <input
            className="new-stock-alert-search-input"
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button
            className="new-stock-alert-search-btn"
            onClick={handleSearch}
          >
            Search
          </button>
          <button
            className="new-stock-alert-report-btn"
            onClick={handleGenerateReport}
          >
            Generate Report
          </button>
        </div>
        <div className="new-stock-alert-table-container">
          <table className="new-stock-alert-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Quantity</th>
                <th>Batch No</th>
                <th>Expiry Date</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((product) => {
                const isLowStock = product.Quantity < 100;
                return (
                  <tr
                    key={product.ProductID}
                    className={isLowStock ? 'new-stock-alert-low' : 'new-stock-alert-high'}
                  >
                    <td>{product.Name}</td>
                    <td>{product.Quantity}</td>
                    <td>{product.BatchNumber}</td>
                    <td>{product.ExpiryDate}</td>
                    <td className={isLowStock ? 'new-stock-alert-low-quantity' : ''}>
                      {product.Quantity}
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

export default AStockAlertNew;
