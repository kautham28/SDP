import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MInventory.css'; // Assuming you have a CSS file for styling the inventory page

const MInventory = () => {
  return (
    <div className="inventory-container">
      <MNavbar />
      <div className="inventory-content">
        <MSidebar />
        <div className="inventory-main">
          <h1>Inventory</h1>
          <p>Manage stock levels and inventory details.</p>
        </div>
      </div>
    </div>
  );
};

export default MInventory;