import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MStockAlert.css'; // Assuming you have a CSS file for styling the stock alert page

const MStockAlert = () => {
  return (
    <div className="stock-alert-container">
      <MNavbar />
      <div className="stock-alert-content">
        <MSidebar />
        <div className="stock-alert-main">
          <h1>Stock Alert</h1>
          <p>Manage stock alerts.</p>
        </div>
      </div>
    </div>
  );
};

export default MStockAlert;