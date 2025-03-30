import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Moon, Sun } from 'lucide-react';
import './MNavbar.css';

const MNavbar = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("Manager");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        console.error("No token found! Redirecting to login...");
        navigate('/login');
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const loggedInUser = response.data.find(user => user.id === parseInt(sessionStorage.getItem("userID")));
        if (loggedInUser) {
          setUsername(loggedInUser.username);
        } else {
          console.error("Manager not found!");
        }
      } catch (error) {
        console.error("Error fetching manager data:", error.response?.data || error.message);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1>Manager Panel</h1>
      </div>
      <div className="navbar-right">
        <span>Welcome, {username}</span>
        <button className="icon-button">
          <Bell size={20} />
        </button>
        <button className="icon-button" onClick={toggleDarkMode}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default MNavbar;
