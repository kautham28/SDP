import React from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MAssignRoles.css'; // Assuming you have a CSS file for styling the assign roles page

const MAssignRoles = () => {
  return (
    <div className="assign-roles-container">
      <MNavbar />
      <div className="assign-roles-content">
        <MSidebar />
        <div className="assign-roles-main">
          <h1>Assign Roles</h1>
          <p>Assign roles to team members.</p>
        </div>
      </div>
    </div>
  );
};

export default MAssignRoles;