import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Moon, Sun } from 'lucide-react'; // Import Lucide icons
import './RNavbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("Rep"); // Default text

  useEffect(() => {
    const fetchUserData = async () => {
      const token = sessionStorage.getItem("token"); // Get token from sessionStorage

      if (!token) {
        console.error("No token found! Redirecting to login...");
        navigate('/login');
        return;
      }

      try {
        // Requesting user data from the backend
        const response = await axios.get("http://localhost:5000/users", {
          headers: {
            Authorization: `Bearer ${token}`, // Attach token in Authorization header
          },
        });

        // Assuming the backend returns a list of users, we filter to find the logged-in user
        const loggedInUser = response.data.find(user => user.id === parseInt(sessionStorage.getItem("userID")));

        if (loggedInUser) {
          setUsername(loggedInUser.username); // Set username of the logged-in user
        } else {
          console.error("User not found!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data || error.message);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear(); // Clear session storage
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode'); // Apply dark mode class
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1>Rep Panel</h1>
      </div>
      <div className="navbar-right">
        <span>Welcome, {username}</span> {/* Displaying dynamic username */}
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

export default Navbar;
