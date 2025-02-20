import React, { useState } from 'react';
import { Eye, Check, Trash2, Search } from 'lucide-react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import "./APendingorder.css";

const APendingorder = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="admin-layout">
      <ASidebar />
      <div className="content">
        <ANavbar />
        <div className="page-content">
          <h1 className="page-title">Pending Orders</h1>
          
          <div className="search-bar">
            <input type="text" placeholder="Search by Pharmacy Name" onChange={handleSearch} />
            <input type="date" placeholder="Search by Date" onChange={handleSearch} />
            <input type="text" placeholder="Search by Rep Name" onChange={handleSearch} />
            <button className="search-btn">
              <Search size={18} className="search-icon" />
              <span>Search</span>
            </button>
          </div>

          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Pharmacy Name</th>
                <th>Rep Name</th>
                <th>Total Value</th>
                <th>Order Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample Row */}
              <tr>
                <td>001</td>
                <td>Pharmacy A</td>
                <td>John Doe</td>
                <td>$500</td>
                <td>2025-02-18</td>
                <td className="action-buttons">
                  <button className="view"><Eye size={20} /></button>
                  <button className="confirm"><Check size={20} /></button>
                  <button className="delete"><Trash2 size={20} /></button>
                </td>
              </tr>
              <tr>
                <td>001</td>
                <td>Pharmacy A</td>
                <td>John Doe</td>
                <td>$500</td>
                <td>2025-02-18</td>
                <td className="action-buttons">
                  <button className="view"><Eye size={20} /></button>
                  <button className="confirm"><Check size={20} /></button>
                  <button className="delete"><Trash2 size={20} /></button>
                </td>
              </tr>
              <tr>
                <td>001</td>
                <td>Pharmacy A</td>
                <td>John Doe</td>
                <td>$500</td>
                <td>2025-02-18</td>
                <td className="action-buttons">
                  <button className="view"><Eye size={20} /></button>
                  <button className="confirm"><Check size={20} /></button>
                  <button className="delete"><Trash2 size={20} /></button>
                </td>
              </tr>
              <tr>
                <td>001</td>
                <td>Pharmacy A</td>
                <td>John Doe</td>
                <td>$500</td>
                <td>2025-02-18</td>
                <td className="action-buttons">
                  <button className="view"><Eye size={20} /></button>
                  <button className="confirm"><Check size={20} /></button>
                  <button className="delete"><Trash2 size={20} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default APendingorder;
