import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ClipboardList, Package, Map, Users, Award, Settings, LogOut } from 'lucide-react';
import './RSidebar.css'; // Create a CSS file for styling

const repMenu = [
  { name: 'Dashboard', path: '/rep/dashboard', icon: <Home size={20} /> },
  { name: 'Make Order', path: '/rep/make-order', icon: <ClipboardList size={20} /> },
  { name: 'Inventory', path: '/rep/inventory', icon: <Package size={20} /> },
  { name: 'Route Details', path: '/rep/route-details', icon: <Map size={20} /> },
  { name: 'Customer Details', path: '/rep/customer-details', icon: <Users size={20} /> },
  { name: 'Rep Achievements', path: '/rep/achievements', icon: <Award size={20} /> },
  { name: 'Settings', path: '/rep/settings', icon: <Settings size={20} /> },
  
];

const RSidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">.</h2>
      <ul className="sidebar-menu">
        {repMenu.map((item, index) => (
          <li key={index} className="sidebar-item">
            <Link to={item.path} className="sidebar-link">
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RSidebar;
