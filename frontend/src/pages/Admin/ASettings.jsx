import React from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ASettings.css';

const ASettings = () => {
  return (
    <div className="admin-settings-page">
      <ASidebar />
      <div className="main-content">
        <ANavbar />
        <div className="settings-content">
          <h1>Settings</h1>
          {/* Add your settings content here */}
        </div>
      </div>
    </div>
  );
};

export default ASettings;