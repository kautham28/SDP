import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun } from 'lucide-react'; // Import Lucide icons
import './ANavbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode'); // Apply dark mode class
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1>Admin Panel</h1>
      </div>
      <div className="navbar-right">
        <span>Welcome, Admin</span>
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
