import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ASettings.css';

const ASettingsPage = () => {
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
      const token = sessionStorage.getItem('token'); // Get token from session storage

      if (!token) {
        console.error('No token found! Redirecting to login...');
        // Redirect to login page if token is not found
        window.location.href = '/login';
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Assuming the API returns an array of users, filter the logged-in user's data
        const loggedInUser = response.data.find(user => user.id === parseInt(sessionStorage.getItem('userID')));

        if (loggedInUser) {
          setUser({
            picture: loggedInUser.picture || '../../src/assets/admin.jpeg', // Default to the placeholder picture if not provided
            name: loggedInUser.username,
            id: loggedInUser.id,
            date_of_birth: loggedInUser.date_of_birth || 'Date not available', // Default if not available
            telephone: loggedInUser.phone_number,
            email: loggedInUser.email,
            nic_number: loggedInUser.ic_number || 'IC not available', // Default if not available
            residentAddress: loggedInUser.address || 'Address not available', // Default if not available
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
    const token = sessionStorage.getItem('token'); // Get token from session storage

    if (!token) {
      console.error('No token found! Redirecting to login...');
      window.location.href = '/login';
      return;
    }

    try {
      // Send updated user data to the backend
      await axios.put(
        `http://localhost:5000/users/update/${user.id}`, // Update endpoint with user ID
        {
          name: user.name,
          email: user.email,
          phone_number: user.telephone,
          address: user.residentAddress,
          date_of_birth: user.date_of_birth,  // Optional
          ic_number: user.nic_number,  // Optional
          picture: user.picture  // Optional
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Send token to authorize request
          },
        }
      );
      setIsEditing(false); // Exit edit mode after saving
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Failed to update profile');
    }
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
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                className="admin-settings-input"
              />
            ) : (
              <h2 className="admin-settings-name">{user.name}</h2>
            )}
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Date of Birth:</strong> {user.date_of_birth}</p>
            <p><strong>NIC Number:</strong> {user.nic_number}</p>
            <p><strong>Role:</strong> Administrator</p>
            <p>
              <strong>Telephone:</strong> {isEditing ? (
                <input
                  type="text"
                  name="telephone"
                  value={user.telephone}
                  onChange={handleChange}
                  className="admin-settings-input"
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
                  className="admin-settings-input"
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
                  className="admin-settings-input"
                />
              ) : (
                user.residentAddress
              )}
            </p>
            <button onClick={isEditing ? handleSaveProfile : handleEditClick} className="admin-settings-edit-button">
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASettingsPage;
