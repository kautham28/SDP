import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Package, Truck, AlertCircle, Settings } from 'lucide-react';
import './ASidebar.css';

const menuItems = [
  { name: 'Dashboard', path: '/admin-dashboard', icon: <Home size={20} /> },
  { name: 'Product List', path: '/admin/product-list', icon: <Package size={20} /> },
  { name: 'Pending Orders', path: '/admin/pending-orders', icon: <Truck size={20} /> },
  { name: 'Confirmed Orders', path: '/admin/confirmed-orders', icon: <Truck size={20} /> },
  { name: 'Expiry Alert', path: '/admin/expiry-alert', icon: <AlertCircle size={20} /> },
  { name: 'Stock Alert', path: '/admin/stock-alert', icon: <AlertCircle size={20} /> },
  { name: 'Route Details', path: '/admin/route-details', icon: <Truck size={20} /> },
  { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> }
];

const ASidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">.</h2>
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
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

export default ASidebar;
