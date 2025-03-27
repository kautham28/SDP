import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from '../../components/Rep/RSidebar'; // Make sure the path is correct
import './RDashboard.css'; 

const RDashboard = () => {
  return (
    <div className="dashboard-container">
      <RNavbar/>
      <RSidebar /> {/* Sidebar is included here */}
      <div className="dashboard-content">
        <h1>Rep Dashboard</h1>
        <p>Welcome to the Rep Dashboard</p>
        {/* You can add more content specific to the Rep role here */}
      </div>
    </div>
  );
};

export default RDashboard;
