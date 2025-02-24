import React, { useState, useEffect } from 'react';
import { Eye, Check, Trash2 } from 'lucide-react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import "./APendingorder.css";
import axios from 'axios';

const APendingorder = () => {
  const [searchPharmacyName, setSearchPharmacyName] = useState('');
  const [searchRepName, setSearchRepName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);

  const handleSearchPharmacyNameChange = (e) => {
    setSearchPharmacyName(e.target.value);
  };

  const handleSearchRepNameChange = (e) => {
    setSearchRepName(e.target.value);
  };

  const handleSearchDateChange = (e) => {
    setSearchDate(e.target.value);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/pending-orders');
        setOrders(response.data);
        setFilteredOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesPharmacyName = order.pharmacy_name.toLowerCase().includes(searchPharmacyName.toLowerCase());
      const matchesRepName = order.rep_name.toLowerCase().includes(searchRepName.toLowerCase());
      const matchesOrderDate = searchDate ? new Date(order.order_date).toLocaleDateString() === new Date(searchDate).toLocaleDateString() : true;
      return matchesPharmacyName && matchesRepName && matchesOrderDate;
    });
    setFilteredOrders(filtered);
  }, [searchPharmacyName, searchRepName, searchDate, orders]);

  return (
    <div className="admin-layout">
      <ASidebar />
      <div className="content">
        <ANavbar />
        <div className="page-content">
          <h1 className="page-title">Pending Orders</h1>
          
          <div className="search-bar">
            <input type="text" placeholder="Search by Pharmacy Name" onChange={handleSearchPharmacyNameChange} />
            <input type="text" placeholder="Search by Rep Name" onChange={handleSearchRepNameChange} />
            <input type="date" placeholder="Search by Date" onChange={handleSearchDateChange} />
          </div>

          <div className="table-container">
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
                {filteredOrders.map(order => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.pharmacy_name}</td>
                    <td>{order.rep_name}</td>
                    <td>${order.total_value}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      <button className="view"><Eye size={20} /></button>
                      <button className="confirm"><Check size={20} /></button>
                      <button className="delete"><Trash2 size={20} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APendingorder;