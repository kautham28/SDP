import React, { useState, useEffect } from 'react';
import { Eye, Check, Trash2 } from 'lucide-react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import axios from 'axios';
import { isSameDay, parseISO } from 'date-fns';
import "./APendingorder.css";
import Swal from "sweetalert2";

const APendingorder = () => {
  const [searchPharmacyName, setSearchPharmacyName] = useState('');
  const [searchRepName, setSearchRepName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [orders, setOrders] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [ordersResponse, pharmaciesResponse, usersResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/pending-orders'),
          axios.get('http://localhost:5000/api/pharmacies/all-pharmacies', { params: { fields: 'PharmacyName,OwnerEmail' } }),
          axios.get('http://localhost:5000/users', { params: { fields: 'id,email' } })
        ]);

        setOrders(ordersResponse.data);
        setFilteredOrders(ordersResponse.data);
        setPharmacies(pharmaciesResponse.data);
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.error || "Failed to load data. Please try again later.",
          icon: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order => {
      const matchesPharmacyName = order.pharmacy_name.toLowerCase().includes(searchPharmacyName.toLowerCase());
      const matchesRepName = order.rep_name.toLowerCase().includes(searchRepName.toLowerCase());
      const orderDate = new Date(order.order_date);
      const searchDateParsed = searchDate ? parseISO(searchDate) : null;
      const matchesOrderDate = !searchDateParsed || isSameDay(orderDate, searchDateParsed);
      return matchesPharmacyName && matchesRepName && matchesOrderDate;
    });
    setFilteredOrders(filtered);
  }, [searchPharmacyName, searchRepName, searchDate, orders]);

  const handleViewOrder = async (orderId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
      if (!response.data || response.data.length === 0) {
        throw new Error('No order details found');
      }
      setSelectedOrder(response.data);
      setShowPopup(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.error || "Failed to load order details. Please try again.",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          await axios.delete(`http://localhost:5000/api/admin/pending-orders/${orderId}`);
          setOrders(orders.filter(order => order.orderId !== orderId));
          setFilteredOrders(filteredOrders.filter(order => order.orderId !== orderId));
          Swal.fire({
            title: "Deleted!",
            text: "The order has been deleted.",
            icon: "success",
          });
        } catch (error) {
          console.error('Error deleting order:', error);
          Swal.fire({
            title: "Error!",
            text: error.response?.data?.error || "Failed to delete the order. Please try again.",
            icon: "error",
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleConfirmOrder = async (orderId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to confirm this order? This will update the representative's achievements.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, confirm it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsLoading(true);
        try {
          const orderDetailsResponse = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
          const orderDetails = orderDetailsResponse.data;

          const order = filteredOrders.find(o => o.orderId === orderId);
          if (!order) {
            throw new Error('Order not found in the current list');
          }

          const pharmacy = pharmacies.find(p =>
            p.PharmacyName.trim().toLowerCase() === order.pharmacy_name.trim().toLowerCase()
          );
          if (!pharmacy) {
            throw new Error(`Pharmacy not found with name: ${order.pharmacy_name}`);
          }
          const pharmacyEmail = pharmacy.OwnerEmail;
          if (!pharmacyEmail) {
            throw new Error(`Email not found for pharmacy: ${order.pharmacy_name}`);
          }

          const rep = users.find(u => u.id === order.UserID);
          if (!rep) {
            throw new Error(`Representative not found with ID: ${order.UserID}`);
          }
          const repEmail = rep.email;
          if (!repEmail) {
            throw new Error(`Email not found for representative: ${order.rep_name}`);
          }

          await axios.put(`http://localhost:5000/api/admin/pending-orders/confirm/${orderId}`);

          await axios.post(
            'http://localhost:5000/api/email/send-order-confirmation',
            {
              orderId,
              pharmacyEmail,
              repEmail,
              pharmacyName: order.pharmacy_name,
              repName: order.rep_name,
              orderDetails
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          setOrders(orders.filter(o => o.orderId !== orderId));
          setFilteredOrders(filteredOrders.filter(o => o.orderId !== orderId));

          Swal.fire({
            title: "Confirmed!",
            text: "Order confirmed, emails sent, and representative achievements updated successfully!",
            icon: "success",
          });
        } catch (error) {
          console.error('Confirmation Error:', error);
          Swal.fire({
            title: "Error!",
            text: error.response?.data?.error || error.message || "Failed to complete confirmation process.",
            icon: "error",
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
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
              placeholder="Search by Order Date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="loading-indicator">Loading...</div>
          ) : (
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
                        <td>${order.total_value?.toFixed(2)}</td>
                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                        <td className="action-buttons-pending">
                          <button
                            className="view-pending"
                            onClick={() => handleViewOrder(order.orderId)}
                            disabled={isLoading}
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            className="confirm-pending"
                            onClick={() => handleConfirmOrder(order.orderId)}
                            disabled={isLoading}
                          >
                            <Check size={20} />
                          </button>
                          <button
                            className="delete-pending"
                            onClick={() => handleDeleteOrder(order.orderId)}
                            disabled={isLoading}
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
          )}

          {showPopup && (
            <div className="popup-overlay show">
              <div className="popup-content large-popup">
                {selectedOrder && selectedOrder.length > 0 ? (
                  <>
                    <h2>Order Details</h2>
                    <div className="order-summary">
                      <p><strong>Order ID:</strong> {selectedOrder[0]?.orderId}</p>
                      <p><strong>Pharmacy:</strong> {selectedOrder[0]?.pharmacy_name}</p>
                      <p><strong>Representative:</strong> {selectedOrder[0]?.rep_name}</p>
                      <p><strong>Order Date:</strong> {new Date(selectedOrder[0]?.order_date).toLocaleString()}</p>
                    </div>
                    <table className="order-details-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Unit Price</th>
                          <th>Quantity</th>
                          <th>Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.map(detail => (
                          <tr key={detail.detailId}>
                            <td>{detail.product_name}</td>
                            <td>${detail.unit_price?.toFixed(2)}</td>
                            <td>{detail.quantity}</td>
                            <td>${detail.total_price?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-right"><strong>Grand Total:</strong></td>
                          <td>${selectedOrder.reduce((sum, item) => sum + (item.total_price || 0), 0)?.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                ) : (
                  <>
                    <h2>Error</h2>
                    <p>No order details available.</p>
                  </>
                )}
                <button className="close-popup" onClick={() => setShowPopup(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APendingorder;