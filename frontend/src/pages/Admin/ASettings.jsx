import React, { useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ASettings.css';

const ASettingsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    picture: '../../src/assets/admin.jpeg',
    name: 'Ram',
    id: 'A12345',
    role: 'Administrator',
    telephone: '+1234567890',
    email: 'ram@example.com',
    residentAddress: '123 Main Street, City, Sri Lanka',
  });

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <div className="admin-settings-page-container">
      <ASidebar />
      <div className="admin-settings-main-content">
        <ANavbar />
        <div className="admin-settings-profile-content">
          <h1 className="admin-settings-title">Settings</h1>
          <div className="admin-settings-profile-container">
            <a href={user.picture} target="_blank" rel="noopener noreferrer">
              <img src={user.picture} alt="User Profile" className="admin-settings-profile-picture" />
            </a>
            {isEditing ? (
              <input type="text" name="name" value={user.name} onChange={handleChange} className="admin-settings-input" />
            ) : (
              <h2 className="admin-settings-name">{user.name}</h2>
            )}
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p>
              <strong>Telephone:</strong> {isEditing ? (
                <input type="text" name="telephone" value={user.telephone} onChange={handleChange} className="admin-settings-input" />
              ) : (
                user.telephone
              )}
            </p>
            <p>
              <strong>Email:</strong> {isEditing ? (
                <input type="email" name="email" value={user.email} onChange={handleChange} className="admin-settings-input" />
              ) : (
                user.email
              )}
            </p>
            <p>
              <strong>Resident Address:</strong> {isEditing ? (
                <input type="text" name="residentAddress" value={user.residentAddress} onChange={handleChange} className="admin-settings-input" />
              ) : (
                user.residentAddress
              )}
            </p>
            <button onClick={handleEditClick} className="admin-settings-edit-button">
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASettingsPage;
