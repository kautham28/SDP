import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MSalesReports.css'; // Assuming you have a CSS file for styling the sales reports page

const MSalesReports = () => {
  return (
    <div className="sales-reports-container">
      <MNavbar />
      <div className="sales-reports-content">
        <MSidebar />
        <div className="sales-reports-main">
          <h1>Sales Reports</h1>
          <p>View and analyze sales reports.</p>
        </div>
      </div>
    </div>
  );
};

export default MSalesReports;