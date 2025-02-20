import React, { useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './AStockalert.css';

const AStockAlert = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockData, setStockData] = useState([
    // Sample data (Replace with real data)
    { id: 1, name: 'Product 1', stock: 150, batchNo: 'A123', expiryDate: '2025-06-01' },
    { id: 2, name: 'Product 2', stock: 75, batchNo: 'B456', expiryDate: '2025-03-15' },
    { id: 3, name: 'Product 3', stock: 200, batchNo: 'C789', expiryDate: '2025-12-20' },
    { id: 4, name: 'Product 4', stock: 50, batchNo: 'D012', expiryDate: '2025-02-28' },
    { id: 5, name: 'Product 5', stock: 125, batchNo: 'E345', expiryDate: '2025-05-10' },
  ]);

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
      {/* Sidebar */}
      <ASidebar />

      <div className="content">
        {/* Navbar */}
        <ANavbar />

        {/* Page Content */}
        <div className="stock-alert-page-title">
          <h1>Stock Alerts</h1>
        </div>

        {/* Search Filters Row */}
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

        {/* Table */}
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
              const isLowStock = product.stock < 100;
              return (
                <tr
                  key={product.id}
                  className={isLowStock ? 'stock-alert-low-stock' : 'stock-alert-high-stock'}
                >
                  <td>{product.name}</td>
                  <td>{product.stock}</td>
                  <td>{product.batchNo}</td>
                  <td>{product.expiryDate}</td>
                  <td className={isLowStock ? 'stock-alert-low-quantity' : ''}>
                    {product.stock}
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
