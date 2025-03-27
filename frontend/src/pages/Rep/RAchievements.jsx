import React from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RAchievements.css';

const RAchievements = () => {
  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Rep Achievements</h1>
        <p>View achievements and performance.</p>
      </div>
    </div>
  );
};

export default RAchievements;
