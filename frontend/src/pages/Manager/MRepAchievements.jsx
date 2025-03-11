import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MRepAchievements.css'; // Assuming you have a CSS file for styling the rep achievements page

const MRepAchievements = () => {
  return (
    <div className="rep-achievements-container">
      <MNavbar />
      <div className="rep-achievements-content">
        <MSidebar />
        <div className="rep-achievements-main">
          <h1>Rep Achievements</h1>
          <p>View and manage representative achievements.</p>
        </div>
      </div>
    </div>
  );
};

export default MRepAchievements;