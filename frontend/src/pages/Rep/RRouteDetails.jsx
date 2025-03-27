import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RRouteDetails.css';

const RRouteDetails = () => {
  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Route Details</h1>
        <p>Check and update route details.</p>
      </div>
    </div>
  );
};

export default RRouteDetails;
