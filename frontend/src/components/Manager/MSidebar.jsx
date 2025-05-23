import React from 'react';
import { Link } from 'react-router-dom';
import { Home, List, Award, Users, Package, BarChart, Settings, ShoppingCart, Bell, Truck } from 'lucide-react'; // Added Truck icon
import './MSidebar.css';

const managerMenu = [
  { name: 'Dashboard', path: '/manager/dashboard', icon: <Home size={20} /> },
  { name: 'Orders', path: '/manager/orders', icon: <List size={20} /> },
  { name: 'Rep Achievements', path: '/manager/rep-achievements', icon: <Award size={20} /> },
  { name: 'Assign Roles', path: '/manager/assign-roles', icon: <Users size={20} /> },
  { name: 'Inventory', path: '/manager/inventory', icon: <Package size={20} /> },
  { name: 'Reports', path: '/manager/sales-reports', icon: <BarChart size={20} /> },
  { name: 'Stock Alert', path: '/manager/stock-alert', icon: <Bell size={20} /> },
  { name: 'Supplier', path: '/manager/supplier', icon: <Truck size={20} /> }, // Added Supplier option
  { name: 'Settings', path: '/manager/settings', icon: <Settings size={20} /> }
];

const MSidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Manager Panel</h2>
      <ul className="sidebar-menu">
        {managerMenu.map((item, index) => (
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

export default MSidebar;
