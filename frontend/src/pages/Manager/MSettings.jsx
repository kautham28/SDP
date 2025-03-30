import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MSidebar from '../../components/Manager/MSidebar';
import MNavbar from '../../components/Manager/MNavbar';
import './MSettings.css';

const MSettingsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    picture: '',
    name: '',
    id: '',
    date_of_birth: '',
    telephone: '',
    email: '',
    nic_number: '',
    residentAddress: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found! Redirecting to login...');
        window.location.href = '/login';
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const loggedInUser = response.data.find(user => user.id === parseInt(sessionStorage.getItem('userID')));

        if (loggedInUser) {
          setUser({
            picture: loggedInUser.picture || '../../src/assets/manager.jpeg',
            name: loggedInUser.username,
            id: loggedInUser.id,
            date_of_birth: loggedInUser.date_of_birth || 'Date not available',
            telephone: loggedInUser.phone_number,
            email: loggedInUser.email,
            nic_number: loggedInUser.ic_number || 'IC not available',
            residentAddress: loggedInUser.address || 'Address not available',
          });
        } else {
          console.error('User not found!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.error('No token found! Redirecting to login...');
      window.location.href = '/login';
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/users/update/${user.id}`,
        {
          name: user.name,
          email: user.email,
          phone_number: user.telephone,
          address: user.residentAddress,
          date_of_birth: user.date_of_birth,
          ic_number: user.nic_number,
          picture: user.picture,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="manager-settings-page-container">
      <MSidebar />
      <div className="manager-settings-main-content">
        <MNavbar />
        <div className="manager-settings-profile-content">
          <h1 className="manager-settings-title">Settings</h1>
          <div className="manager-settings-profile-container">
            <a href={user.picture} target="_blank" rel="noopener noreferrer">
              <img src={user.picture} alt="User Profile" className="manager-settings-profile-picture" />
            </a>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                className="manager-settings-input"
              />
            ) : (
              <h2 className="manager-settings-name">{user.name}</h2>
            )}
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
            <p><strong>NIC Number:</strong> {user.nic_number}</p>
            <p><strong>Role:</strong> Manager</p>
            <p>
              <strong>Telephone:</strong> {isEditing ? (
                <input
                  type="text"
                  name="telephone"
                  value={user.telephone}
                  onChange={handleChange}
                  className="manager-settings-input"
                />
              ) : (
                user.telephone
              )}
            </p>
            <p>
              <strong>Email:</strong> {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  className="manager-settings-input"
                />
              ) : (
                user.email
              )}
            </p>
            <p>
              <strong>Resident Address:</strong> {isEditing ? (
                <input
                  type="text"
                  name="residentAddress"
                  value={user.residentAddress}
                  onChange={handleChange}
                  className="manager-settings-input"
                />
              ) : (
                user.residentAddress
              )}
            </p>
            <button onClick={isEditing ? handleSaveProfile : handleEditClick} className="manager-settings-edit-button">
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSettingsPage;