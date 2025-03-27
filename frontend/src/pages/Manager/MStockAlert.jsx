import React, { useEffect, useState } from "react";
import MSidebar from "../../components/Manager/MSidebar";  // Change this to Manager Sidebar component
import MNavbar from "../../components/Manager/MNavbar";  // Change this to Manager Navbar component
import "./MStockAlert.css";  // Adjust the CSS file if necessary for Manager
import axios from "axios";

const MStockAlert = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/products/low-stock" // Adjust the API endpoint if necessary
        );
        setStockData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Error fetching low stock products:", error);
      }
    };

    fetchLowStockProducts();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    const filtered = stockData.filter((product) =>
      product.Name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleGenerateReport = () => {
    console.log("Generate Report clicked");
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="new-stock-alert-wrapper">
      <MSidebar />  {/* Change to Manager Sidebar */}
      <div className="new-stock-alert-content">
        <MNavbar />  {/* Change to Manager Navbar */}
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
              {filteredData.map((product) => {
                const isLowStock = product.Quantity < 100;
                return (
                  <tr
                    key={product.ProductID}
                    className={isLowStock ? "new-stock-alert-low" : "new-stock-alert-high"}
                  >
                    <td>{product.Name}</td>
                    <td>{product.Quantity}</td>
                    <td>{product.BatchNumber}</td>
                    <td>{formatDate(product.ExpiryDate)}</td>
                    <td className={isLowStock ? "new-stock-alert-low-quantity" : ""}>
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

export default MStockAlert;
