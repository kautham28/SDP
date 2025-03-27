import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RCustomerDetails.css';

const RCustomerDetails = () => {
  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Customer Details</h1>
        <p>Manage customer information.</p>
      </div>
    </div>
  );
};

export default RCustomerDetails;
