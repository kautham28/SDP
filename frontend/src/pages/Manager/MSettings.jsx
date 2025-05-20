import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MSidebar from '../../components/Manager/MSidebar';
import MNavbar from '../../components/Manager/MNavbar';
import './MSettings.css';
import adminPlaceholder from '../../assets/admin.jpeg';

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
  const [password, setPassword] = useState("");
  const [photoLink, setPhotoLink] = useState(user.picture || "");

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
            picture: loggedInUser.photo_link || '', // Use photo_link from backend
            name: loggedInUser.username,
            id: loggedInUser.id,
            date_of_birth: loggedInUser.date_of_birth || 'Date not available',
            telephone: loggedInUser.phone_number,
            email: loggedInUser.email,
            nic_number: loggedInUser.ic_number || 'IC not available',
            residentAddress: loggedInUser.address || 'Address not available',
          });
          setPhotoLink(loggedInUser.photo_link || '');
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoLink(response.data.url); // Set Cloudinary URL
      alert('Image uploaded successfully!');
    } catch (err) {
      alert('Image upload failed');
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.error('No token found! Redirecting to login...');
      window.location.href = '/login';
      return;
    }

    try {
      const formattedDOB = user.date_of_birth ? new Date(user.date_of_birth).toISOString().slice(0, 10) : '';
      const updateData = {
        username: user.name,
        email: user.email,
        phone_number: user.telephone,
        address: user.residentAddress,
        date_of_birth: formattedDOB,
        ic_number: user.nic_number,
      };
      if (password) updateData.password = password;
      if (photoLink) updateData.photo_link = photoLink;
      await axios.put(
        `http://localhost:5000/users/${user.id}`,
        updateData,
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
            {user.picture || photoLink ? (
              <a href={`http://localhost:5000${photoLink || user.picture}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`http://localhost:5000${photoLink || user.picture}`}
                  alt="User Profile"
                  className="manager-settings-profile-picture"
                  onError={e => { e.target.onerror = null; e.target.src = adminPlaceholder; }}
                />
              </a>
            ) : null}
            {isEditing ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="manager-settings-input"
                />
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  className="manager-settings-input"
                />
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="manager-settings-input"
                />
                <input
                  type="text"
                  name="photo_link"
                  value={photoLink}
                  onChange={e => setPhotoLink(e.target.value)}
                  placeholder="Profile Picture URL"
                  className="manager-settings-input"
                />
              </>
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