import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Admin/ASidebar";
import Navbar from "../../components/Admin/ANavbar";
import { Package, ClipboardList, ShoppingBag, Users } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "../Admin/Admindashboard.css";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    balanceStock: 0,
    pendingOrders: 0,
    totalSales: 0,
    numberOfReps: 0,
    barChartData: { labels: [], datasets: [] },
    lineChartData: {
      labels: [],
      datasets: [{
        label: "Rep Sales (Current Month)",
        data: [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      }],
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch general dashboard data
        const response = await fetch("http://localhost:5000/api/dashboard");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorData.details || 'Unknown'}`);
        }
        const data = await response.json();

        // Fetch current month rep sales
        const repSalesResponse = await fetch("http://localhost:5000/api/rep-sales-current-month");
        if (!repSalesResponse.ok) {
          const errorData = await repSalesResponse.json();
          throw new Error(`HTTP error! Status: ${repSalesResponse.status}, Details: ${errorData.details || 'Unknown'}`);
        }
        const repSalesData = await repSalesResponse.json();

        // Filter out negative TotalSales
        const positiveRepSalesData = repSalesData.filter(item => item.TotalSales >= 0);

        // Update line chart data
        const updatedLineChartData = {
          labels: positiveRepSalesData.map(item => `Rep ${item.RepID}`),
          datasets: [{
            label: "Rep Sales (Current Month)",
            data: positiveRepSalesData.map(item => item.TotalSales),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: true,
          }],
        };

        setDashboardData({
          ...data,
          lineChartData: updatedLineChartData,
        });
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Bar chart options
  const barChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        suggestedMax: Math.max(...(dashboardData.barChartData.datasets[0]?.data || [1000])) * 1.1, // 10% padding
        ticks: {
          stepSize: Math.ceil(Math.max(...(dashboardData.barChartData.datasets[0]?.data || [1000])) / 5),
          callback: function(value) {
            return value.toLocaleString(); // Format with commas
          },
        },
        title: {
          display: false, // No y-axis title in the image
        },
      },
      x: {
        title: {
          display: false, // No x-axis title in the image
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          boxWidth: 20,
          padding: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Monthly Sales: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Line chart options
  const lineChartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        suggestedMax: Math.max(...(dashboardData.lineChartData.datasets[0]?.data || [1000])) * 1.1,
        ticks: {
          stepSize: Math.ceil(Math.max(...(dashboardData.lineChartData.datasets[0]?.data || [1000])) / 5),
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
    maintainAspectRatio: false,
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard-content">
        <Sidebar />
        <main className="admin-dashboard-main">
          <h2 className="admin-dashboard-title">Dashboard</h2>
          <div className="admin-dashboard-cards">
            <div className="admin-dashboard-card">
              <Package className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Balance Stock</h3>
              <p>{dashboardData.balanceStock.toLocaleString()}</p>
            </div>
            <div className="admin-dashboard-card">
              <ClipboardList className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Pending Orders</h3>
              <p>{dashboardData.pendingOrders.toLocaleString()}</p>
            </div>
            <div className="admin-dashboard-card">
              <ShoppingBag className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Total Sales</h3>
              <p>{dashboardData.totalSales.toLocaleString()}</p>
            </div>
            <div className="admin-dashboard-card">
              <Users className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Number of Reps</h3>
              <p>{dashboardData.numberOfReps}</p>
            </div>
          </div>
          <div className="admin-dashboard-charts">
            <div className="admin-dashboard-chart-container" style={{ height: "300px" }}>
              <h3>Last 5 Months Sales</h3>
              <Bar data={dashboardData.barChartData} options={barChartOptions} />
            </div>
            <div className="admin-dashboard-chart-container" style={{ height: "300px" }}>
              <h3>Rep Sales (Current Month)</h3>
              <Line data={dashboardData.lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;