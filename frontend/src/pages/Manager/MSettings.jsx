import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MSettings.css'; // Assuming you have a CSS file for styling the settings page

const MSettings = () => {
  return (
    <div className="settings-container">
      <MNavbar />
      <div className="settings-content">
        <MSidebar />
        <div className="settings-main">
          <h1>Settings</h1>
          <p>Manage system settings.</p>
        </div>
      </div>
    </div>
  );
};

export default MSettings;