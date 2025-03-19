import React, { useState } from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import MButton from '../../components/Manager/MButton';
import MDropdown from '../../components/Manager/MDropdown';
import './MAssignRoles.css'; // Assuming you have a CSS file for styling the assign roles page

const MAssignRoles = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const [userName, setUserName] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([
    { name: "John Doe", role: "Admin" },
    { name: "Jane Smith", role: "Editor" },
  ]);

  const handleAssignRole = () => {
    if (userName && selectedRole) {
      setAssignedUsers([...assignedUsers, { name: userName, role: selectedRole }]);
      setUserName("");
      setSelectedRole("");
    } else {
      alert("Please enter a name and select a role.");
    }
  };

  return (
    <div className="assign-roles-container">
      <MNavbar />
      <div className="assign-roles-content">
        <MSidebar />
        <div className="assign-roles-main">
          <h1>Assign Roles</h1>
          <p>Assign roles to team members.</p>

          {/* Add Role Section */}
          <div className="assign-role-form">
            <input
              type="text"
              placeholder="Enter Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="assign-input"
            />
            <MDropdown
              options={["Admin", "Editor", "User"]}
              selectedValue={selectedRole}
              onSelect={setSelectedRole}
            />
            <MButton 
              label="Assign Role" 
              onClick={handleAssignRole} 
              variant="primary" 
              disabled={!userName || !selectedRole} 
            />
          </div>

          {/* Assigned Users Table */}
          <h3>Assigned Users</h3>
          <table className="assign-role-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {assignedUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MAssignRoles;
