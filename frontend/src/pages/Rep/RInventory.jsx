import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RInventory.css';

const RInventory = () => {
  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Inventory</h1>
        <p>View and manage inventory.</p>
      </div>
    </div>
  );
};

export default RInventory;
