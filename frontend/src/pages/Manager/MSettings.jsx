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
  const [photoLink, setPhotoLink] = useState(user.picture || '');
  const [password, setPassword] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const loggedInUser = response.data.find(user => user.id === parseInt(sessionStorage.getItem('userID')));
        if (loggedInUser) {
          setUser({
            picture: loggedInUser.photo_link || '',
            name: loggedInUser.username,
            id: loggedInUser.id,
            date_of_birth: loggedInUser.date_of_birth || 'Date not available',
            telephone: loggedInUser.phone_number,
            email: loggedInUser.email,
            nic_number: loggedInUser.ic_number || 'IC not available',
            residentAddress: loggedInUser.address || 'Address not available',
          });
          setPhotoLink(loggedInUser.photo_link || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleEditClick = () => setIsEditing(true);
  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoLink(response.data.url);
      alert('Image uploaded successfully!');
    } catch (err) {
      alert('Image upload failed');
    }
  };
  const handleSaveProfile = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
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
      await axios.put(`http://localhost:5000/users/${user.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  return (
    <div className="manager-settings-page-container">
      <MSidebar />
      <div className="manager-settings-main-content">
        <MNavbar />
        <div className="manager-settings-profile-content">
          <h1 className="manager-settings-title">Personal Information</h1>
          <div className="manager-settings-profile-container">
            <div className="manager-settings-profile-picture-container">
              {user.picture || photoLink ? (
                <a href={`http://localhost:5000${photoLink || user.picture}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`http://localhost:5000${photoLink || user.picture}`}
                    alt="User Profile"
                    className="manager-settings-profile-picture"
                    onError={e => { e.target.onerror = null; e.target.src = adminPlaceholder; }}
                  />
                </a>
              ) : (
                <img
                  src={adminPlaceholder}
                  alt="User Profile Placeholder"
                  className="manager-settings-profile-picture"
                />
              )}
              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="manager-settings-input-file"
                />
              )}
            </div>
            <div className="manager-settings-fields">
              <div className="manager-settings-column">
                <div className="manager-settings-field">
                  <label>Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={user.name}
                      onChange={handleChange}
                      className="manager-settings-input"
                    />
                  ) : (
                    <p className="manager-settings-value">{user.name}</p>
                  )}
                </div>
                <div className="manager-settings-field">
                  <label>ID</label>
                  <p className="manager-settings-value">{user.id}</p>
                </div>
                <div className="manager-settings-field">
                  <label>Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="date_of_birth"
                      value={user.date_of_birth}
                      onChange={handleChange}
                      className="manager-settings-input"
                    />
                  ) : (
                    <p className="manager-settings-value">{user.date_of_birth}</p>
                  )}
                </div>
                <div className="manager-settings-field">
                  <label>Telephone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="telephone"
                      value={user.telephone}
                      onChange={handleChange}
                      className="manager-settings-input"
                    />
                  ) : (
                    <p className="manager-settings-value">{user.telephone}</p>
                  )}
                </div>
                {isEditing && (
                  <div className="manager-settings-field">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      className="manager-settings-input"
                      placeholder="New Password"
                    />
                  </div>
                )}
              </div>
              <div className="manager-settings-column">
                <div className="manager-settings-field">
                  <label>NIC Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nic_number"
                      value={user.nic_number}
                      onChange={handleChange}
                      className="manager-settings-input"
                    />
                  ) : (
                    <p className="manager-settings-value">{user.nic_number}</p>
                  )}
                </div>
                <div className="manager-settings-field">
                  <label>Role</label>
                  <p className="manager-settings-value">Manager</p>
                </div>
                <div className="manager-settings-field">
                  <label>Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={user.email}
                      onChange={handleChange}
                      className="manager-settings-input"
                    />
                  ) : (
                    <p className="manager-settings-value">{user.email}</p>
                  )}
                </div>
                <div className="manager-settings-field">
                  <label>Resident Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="residentAddress"
                      value={user.residentAddress}
                      onChange={handleChange}
                      className="manager-settings-input"
                    />
                  ) : (
                    <p className="manager-settings-value">{user.residentAddress}</p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={isEditing ? handleSaveProfile : handleEditClick}
              className="manager-settings-edit-button"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSettingsPage;