import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './AStockalert.css';
import axios from 'axios';

const AStockAlert = () => {
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
    // Logic to filter products based on search query (if applicable)
    console.log('Search clicked:', searchQuery);
  };

  const handleGenerateReport = () => {
    // Logic to generate report
    console.log('Generate Report clicked');
  };

  return (
    <div className="stock-alert-full-page">
      <ASidebar />
      <div className="content">
        <ANavbar />
        <div className="stock-alert-page-title">
          <h1>Stock Alerts</h1>
        </div>
        <div className="stock-alert-search-container">
          <input
            className="stock-alert-search-input"
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button
            className="stock-alert-search-button"
            onClick={handleSearch}
          >
            Search
          </button>
          <button
            className="stock-alert-report-button"
            onClick={handleGenerateReport}
          >
            Generate Report
          </button>
        </div>
        <table className="stock-alert-table">
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
                  className={isLowStock ? 'stock-alert-low-stock' : 'stock-alert-high-stock'}
                >
                  <td>{product.Name}</td>
                  <td>{product.Quantity}</td>
                  <td>{product.BatchNumber}</td>
                  <td>{product.ExpiryDate}</td>
                  <td className={isLowStock ? 'stock-alert-low-quantity' : ''}>
                    {product.Quantity}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AStockAlert;