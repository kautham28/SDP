import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RAchievements.css';

import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer
} from 'recharts';

const RAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Generate list of all 12 months for the current year (2025)
  const currentYear = new Date().getFullYear(); // 2025
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthOptions = months.map(month => `${month}-${currentYear}`);

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
      const repID = sessionStorage.getItem('userID');

      if (!token || !repID) {
        console.error('No token or RepID found! Redirecting to login...');
        window.location.href = '/login';
        return;
      }

      try {
        const achievementsResponse = await axios.get(`http://localhost:5000/api/achievements/${repID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAchievements(achievementsResponse.data);

        const confirmedOrdersResponse = await axios.get(`http://localhost:5000/api/confirmed-orders/${repID}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConfirmedOrders(confirmedOrdersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set default selected month to the current month (May 2025)
  useEffect(() => {
    const currentMonthIndex = new Date().getMonth(); // 4 (May)
    setSelectedMonth(`${months[currentMonthIndex]}-${currentYear}`);
  }, []);

  // Filter achievements based on the selected month and year
  const filteredAchievements = achievements.filter(ach => {
    const [selectedMonthName, selectedYear] = selectedMonth.split('-');
    return ach.Month === selectedMonthName && ach.Year.toString() === selectedYear;
  });

  return (
    <div className="rach-container">
      <RNavbar />
      <div className="rach-content">
        <h1 className="rach-title">Rep Achievements</h1>
        {loading ? (
          <p className="rach-status-msg">Loading data...</p>
        ) : error ? (
          <p className="rach-error-msg">{error}</p>
        ) : (
          <>
            <div className="rach-achievements">
              <div className="rach-month-select">
                <label htmlFor="monthSelect">Select Month: </label>
                <select
                  id="monthSelect"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rach-select"
                >
                  {monthOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {filteredAchievements.length === 0 ? (
                <p className="rach-status-msg">No achievements found for this month.</p>
              ) : (
                filteredAchievements.map((ach, index) => {
                  const pieData = [
                    { name: 'Achieved', value: ach.percentage },
                    { name: 'Remaining', value: 100 - ach.percentage }
                  ];
                  return (
                    <div key={index} className="rach-row">
                      <div className="rach-box">
                        <p><strong>Month:</strong> {ach.Month}</p>
                        <p><strong>Year:</strong> {ach.Year}</p>
                        <p><strong>Target:</strong> {ach.Target}</p>
                        <p><strong>Total Sales:</strong> {ach.TotalSales}</p>
                        <p><strong>Percentage:</strong> {ach.percentage}%</p>
                        <p><strong>Last Updated:</strong> {new Date(ach.LastUpdated).toLocaleString()}</p>
                      </div>
                      <div className="rach-chart">
                        <ResponsiveContainer width={300} height={300}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              fill="#8884d8"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((entry, idx) => (
                                <Cell
                                  key={`cell-${idx}`}
                                  fill={idx === 0 ? '#00C49F' : '#FFBB28'}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Legend
                              layout="vertical"
                              verticalAlign="middle"
                              align="right"
                              wrapperStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="rach-orders">
              <h2 className="rach-subtitle">Confirmed Orders</h2>
              {confirmedOrders.length === 0 ? (
                <p className="rach-status-msg">No confirmed orders found.</p>
              ) : (
                <table className="rach-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Amount</th>
                      <th>Confirmed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmedOrders.map((order, index) => (
                      <tr key={index}>
                        <td>{order.OrderID}</td>
                        <td>{order.PharmacyName}</td>
                        <td>{order.TotalValue}</td>
                        <td>{new Date(order.ConfirmedDate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
      <RSidebar />
    </div>
  );
};

export default RAchievements;