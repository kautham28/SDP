import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MMakePurchase.css'; // Assuming you have a CSS file for styling the make purchase page

const MMakePurchase = () => {
  return (
    <div className="make-purchase-container">
      <MNavbar />
      <div className="make-purchase-content">
        <MSidebar />
        <div className="make-purchase-main">
          <h1>Make Purchase</h1>
          <p>Manage purchases.</p>
        </div>
      </div>
    </div>
  );
};

export default MMakePurchase;