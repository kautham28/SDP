import React, { useState, useEffect } from 'react';
import { Eye, Check, Trash2 } from 'lucide-react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import axios from 'axios';
import "./APendingorder.css";

const APendingorder = () => {
  const [searchPharmacyName, setSearchPharmacyName] = useState('');
  const [searchRepName, setSearchRepName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // Popup data
  const [showPopup, setShowPopup] = useState(false);

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
      const matchesOrderDate = searchDate ? new Date(order.order_date).toISOString().split('T')[0] === searchDate : true;
      return matchesPharmacyName && matchesRepName && matchesOrderDate;
    });
    setFilteredOrders(filtered);
  }, [searchPharmacyName, searchRepName, searchDate, orders]);

  // Fetch order details when clicking the Eye button
  const handleViewOrder = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
      setSelectedOrder(response.data); // Store order details in state
      setShowPopup(true); // Show the popup
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  // Handle Delete Order
  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this order?');
    
    if (confirmDelete) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/admin/pending-orders/${orderId}`);
        console.log('Order deleted:', response.data);
        // Remove the deleted order from the filteredOrders list
        setFilteredOrders(filteredOrders.filter(order => order.orderId !== orderId));
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  // Handle Confirm Order
  const handleConfirmOrder = async (orderId) => {
    const confirmOrder = window.confirm('Are you sure you want to confirm this order?');

    if (confirmOrder) {
      try {
        // Make the API request to confirm the order
        const response = await axios.put(`http://localhost:5000/api/admin/pending-orders/confirm/${orderId}`);
        console.log('Order confirmed:', response.data);
        
        // Remove the confirmed order from the filtered list
        setFilteredOrders(filteredOrders.filter(order => order.orderId !== orderId));
      } catch (error) {
        console.error('Error confirming order:', error);
      }
    }
  };

  return (
    <div className="admin-layout-pending">
      <ASidebar />
      <div className="content-pending">
        <ANavbar />
        <div className="page-content-pending">
          <h1 className="page-title-pending">Pending Orders</h1>
          
          <div className="search-bar-pending">
            <input 
              type="text" 
              placeholder="Search by Pharmacy Name" 
              value={searchPharmacyName}
              onChange={(e) => setSearchPharmacyName(e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Search by Rep Name" 
              value={searchRepName}
              onChange={(e) => setSearchRepName(e.target.value)} 
            />
            <input 
              type="date" 
              value={searchDate} 
              onChange={(e) => setSearchDate(e.target.value)} 
            />
          </div>

          <div className="table-container-pending">
            <table className="orders-table-pending">
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
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <tr key={order.orderId}>
                      <td>{order.orderId}</td>
                      <td>{order.pharmacy_name}</td>
                      <td>{order.rep_name}</td>
                      <td>{order.total_value}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="action-buttons-pending">
                        <button 
                          className="view-pending" 
                          aria-label="View Order"
                          onClick={() => handleViewOrder(order.orderId)}
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          className="confirm-pending" 
                          aria-label="Confirm Order"
                          onClick={() => handleConfirmOrder(order.orderId)} 
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          className="delete-pending" 
                          aria-label="Delete Order"
                          onClick={() => handleDeleteOrder(order.orderId)} 
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-orders">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popup for Order Details */}
        {showPopup && selectedOrder && (
          <div className="popup-overlay show">
            <div className="popup-content large-popup">
              <h2>Order Details</h2>
              <p><strong>Order ID:</strong> {selectedOrder[0]?.orderId}</p>
              <table className="order-details-table">
                <thead>
                  <tr>
                    <th>Detail ID</th>
                    <th>Product Name</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.map(detail => (
                    <tr key={detail.detailId}>
                      <td>{detail.detailId}</td>
                      <td>{detail.product_name}</td>
                      <td>{detail.unit_price}</td>
                      <td>{detail.quantity}</td>
                      <td>{detail.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="close-popup" onClick={() => setShowPopup(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APendingorder;
