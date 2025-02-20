import React from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './AExpiryalert.css';

const AExpiryalert = () => {
  const sampleData = [
    { medicine: "Medicine A", batch: "12345", quantity: 50, daysToExpiry: 10, totalValue: "$100" },
    { medicine: "Medicine B", batch: "12346", quantity: 200, daysToExpiry: 15, totalValue: "$500" },
    { medicine: "Medicine C", batch: "12347", quantity: 80, daysToExpiry: 20, totalValue: "$200" },
    { medicine: "Medicine D", batch: "12348", quantity: 150, daysToExpiry: 30, totalValue: "$450" },
    { medicine: "Medicine E", batch: "12349", quantity: 90, daysToExpiry: 5, totalValue: "$90" }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <ASidebar />

      <div className="content">
        {/* Navbar */}
        <ANavbar />

        {/* Page Content */}
        <div className="expiry-page-content">
          {/* Page Title */}
          <h1 className="expiry-page-title">Expiry Alert</h1>

          {/* Search Filters Row */}
          <div className="expiry-search-container">
            <input type="text" className="expiry-search-input" placeholder="Search by medicine name" />
            <input type="text" className="expiry-search-input" placeholder="Search by batch number" />
            <button className="expiry-search-button">Search</button>
            <button className="expiry-report-button">Generate Report</button>
          </div>

          {/* Table */}
          <table className="expiry-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Batch Number</th>
                <th>Quantity</th>
                <th>Days to Expiry</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, index) => (
                <tr key={index} className={item.daysToExpiry < 30 ? 'expiry-low-stock' : ''}>
                  <td>{item.medicine}</td>
                  <td>{item.batch}</td>
                  <td>{item.quantity}</td>
                  <td className={item.daysToExpiry < 30 ? 'expiry-low-days' : ''}>
                    {item.daysToExpiry}
                  </td>
                  <td>{item.totalValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AExpiryalert;
