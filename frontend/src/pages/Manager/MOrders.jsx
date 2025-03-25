import React, { useEffect, useState } from 'react';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import './MOrders.css'; // Assuming you have a CSS file for styling the orders page
import axios from 'axios';

const MOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchPharmacy, setSearchPharmacy] = useState('');
  const [searchRep, setSearchRep] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/confirmed-orders')
      .then((response) => {
        console.log('Response data:', response.data);
        setOrders(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching orders:', err);
        setError('Error fetching orders');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const filteredOrders = orders.filter(order => 
    order.PharmacyName.toLowerCase().includes(searchPharmacy.toLowerCase()) &&
    order.RepName.toLowerCase().includes(searchRep.toLowerCase())
  );

  return (
    <div className="orders-container">
      <MNavbar />
      <div className="orders-content">
        <MSidebar />
        <div className="orders-main">
          <h1>Orders</h1>
          <p>Manage and track orders.</p>

          {/* Filter Inputs */}
          <div className="filters">
            <input
              type="text"
              placeholder="Search by Pharmacy Name"
              value={searchPharmacy}
              onChange={(e) => setSearchPharmacy(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search by Rep Name"
              value={searchRep}
              onChange={(e) => setSearchRep(e.target.value)}
            />
          </div>

          <div className="orders-list">
            {filteredOrders.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Rep Name</th>
                    <th>Order Date</th>
                    <th>Confirmed Date</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.OrderID}>
                      <td>{order.OrderID}</td>
                      <td>{order.PharmacyName}</td>
                      <td>{order.RepName}</td>
                      <td>{new Date(order.OrderDate).toLocaleDateString()}</td>
                      <td>{new Date(order.ConfirmedDate).toLocaleDateString()}</td>
                      <td>{order.TotalValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No confirmed orders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MOrders;
