import React, { useEffect, useState } from "react";
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import "./AExpiryalert.css";
import axios from "axios";

const AExpiryalert = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch all products initially
  useEffect(() => {
    const fetchExpiringProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/admin/products/expiring-soon"
        );
        setProducts(response.data);
        setFilteredProducts(response.data); // Initialize with all products
      } catch (error) {
        console.error("Error fetching expiring products:", error);
      }
    };

    fetchExpiringProducts();
  }, []);

  const handleSearch = () => {
    let filteredData = [...products];

    // Filter by name
    if (searchName) {
      filteredData = filteredData.filter((item) =>
        item.Name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      filteredData = filteredData.filter((item) => {
        const expiryDate = new Date(item.ExpiryDate);
        return expiryDate >= new Date(startDate) && expiryDate <= new Date(endDate);
      });
    }

    setFilteredProducts(filteredData);
  };

  const handleReturn = (productId) => {
    console.log("Return product with ID:", productId);
    // You can add logic for returning the product here
  };

  return (
    <div className="admin-layout">
      <ASidebar />
      <div className="admin-content">
        <ANavbar />
        <div className="expiry-alert-content">
          <h1 className="expiry-alert-title">Expiry Alert</h1>

          {/* Search & Report Buttons */}
          <div className="expiry-alert-search-container">
            <div className="expiry-alert-search-item">
              <label className="expiry-alert-search-label" htmlFor="nameSearch">
                Medicine Name
              </label>
              <input
                type="text"
                id="nameSearch"
                className="expiry-alert-search-input"
                placeholder="Search by medicine name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <div className="expiry-alert-search-item">
              <label className="expiry-alert-search-label" htmlFor="startDate">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                className="expiry-alert-search-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="expiry-alert-search-item">
              <label className="expiry-alert-search-label" htmlFor="endDate">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                className="expiry-alert-search-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="expiry-alert-search-button" onClick={handleSearch}>
              Search
            </button>
            <button className="expiry-alert-report-button">Generate Report</button>
          </div>

          {/* Expiry Table */}
          <table className="expiry-alert-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Batch Number</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Days to Expiry</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item, index) => {
                const daysToExpiry = Math.ceil(
                  (new Date(item.ExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const expiryDate = new Date(item.ExpiryDate).toLocaleDateString();

                // Format Unit Price correctly
                const unitPrice = item.Price && !isNaN(item.Price)
                  ? item.Price.toFixed(2)
                  : "N/A"; // Ensure that Price is a valid number
                const totalValue = item.Quantity * (item.Price || 0); // Calculate total value

                return (
                  <tr
                    key={index}
                    className={daysToExpiry < 30 ? "expiry-alert-low-stock" : ""}
                  >
                    <td>{item.Name}</td>
                    <td>{item.BatchNumber}</td>
                    <td>{expiryDate}</td>
                    <td>{item.Quantity}</td>
                    <td>{item.UnitPrice.toFixed(2)}</td> {/* Display Unit Price */}
                    <td>{item.TotalPrice.toFixed(2)}</td> {/* Display Total Value */}
                    <td className="expiry-alert-days-to-expiry">{daysToExpiry}</td>
                    <td>
                      <button
                        className="expiry-alert-return-button"
                        onClick={() => handleReturn(item.ID)}
                      >
                        Return
                      </button>
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
