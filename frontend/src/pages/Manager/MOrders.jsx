import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MOrders.css'; // Assuming you have a CSS file for styling the orders page

const MOrders = () => {
  return (
    <div className="orders-container">
      <MNavbar />
      <div className="orders-content">
        <MSidebar />
        <div className="orders-main">
          <h1>Orders</h1>
          <p>Manage and track orders.</p>
        </div>
      </div>
    </div>
  );
};

export default MOrders;