import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RSettings.css';

const RSettings = () => {
  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Settings</h1>
        <p>Update your preferences and settings.</p>
      </div>
    </div>
  );
};

export default RSettings;
