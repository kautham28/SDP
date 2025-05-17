import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RDashboard.css';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const RDashboard = () => {
  const [achievements, setAchievements] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Generate list of all 12 months for the current year (2025)
  const currentYear = new Date().getFullYear();
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
    const currentMonthIndex = new Date().getMonth();
    setSelectedMonth(`${months[currentMonthIndex]}-${currentYear}`);
  }, []);

  // Filter achievements based on the selected month and year
  const filteredAchievements = achievements.filter(ach => {
    const [selectedMonthName, selectedYear] = selectedMonth.split('-');
    return ach.Month === selectedMonthName && ach.Year.toString() === selectedYear;
  });

  return (
    <div className="dashboard-container">
      <RNavbar />
      <div className="dashboard-content">
        <h1 className="dashboard-title">Rep Dashboard</h1>
        {loading ? (
          <p className="dashboard-status-msg">Loading data...</p>
        ) : error ? (
          <p className="dashboard-error-msg">{error}</p>
        ) : (
          <>
            <div className="dashboard-achievements">
              <div className="dashboard-month-select">
                <label htmlFor="monthSelect">Select Month: </label>
                <select
                  id="monthSelect"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="dashboard-select"
                >
                  {monthOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {filteredAchievements.length === 0 ? (
                <p className="dashboard-status-msg">No achievements found for this month.</p>
              ) : (
                filteredAchievements.map((ach, index) => {
                  const pieData = {
                    labels: ['Achieved', 'Remaining'],
                    datasets: [
                      {
                        data: [ach.percentage, 100 - ach.percentage],
                        backgroundColor: ['#00C49F', '#ec7063'],
                        borderColor: ['#000000', '#000000'],
                        borderWidth: 1,
                      },
                    ],
                  };
                  const options = {
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: {
                            size: 14,
                            weight: 'bold',
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${context.raw}%`,
                        },
                      },
                    },
                    maintainAspectRatio: false,
                  };
                  return (
                    <div key={index} className="dashboard-row">
                      <div className="dashboard-box">
                        <p><strong>Month:</strong> {ach.Month}</p>
                        <p><strong>Year:</strong> {ach.Year}</p>
                        <p><strong>Target:</strong> {ach.Target}</p>
                        <p><strong>Total Sales:</strong> {ach.TotalSales}</p>
                        <p><strong>Percentage:</strong> {ach.percentage}%</p>
                        <p><strong>Last Updated:</strong> {new Date(ach.LastUpdated).toLocaleDateString()}</p>
                      </div>
                      <div className="dashboard-chart">
                        <Pie data={pieData} options={options} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="dashboard-orders">
              <h2 className="dashboard-subtitle">Confirmed Orders</h2>
              {confirmedOrders.length === 0 ? (
                <p className="dashboard-status-msg">No confirmed orders found.</p>
              ) : (
                <table className="dashboard-table">
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
                        <td>{new Date(order.ConfirmedDate).toLocaleDateString()}</td>
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

export default RDashboard;