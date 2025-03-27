import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RMakeOrder.css';

const RMakeOrder = () => {
  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Make Order</h1>
        <p>Place a new order here.</p>
      </div>
    </div>
  );
};

export default RMakeOrder;
