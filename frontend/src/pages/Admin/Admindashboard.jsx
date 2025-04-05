import React from "react";
import Sidebar from "../../components/Admin/ASidebar";
import Navbar from "../../components/Admin/ANavbar";
import { Package, ClipboardList, ShoppingBag, Users } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "../Admin/Admindashboard.css"; // Updated CSS file name

const AdminDashboard = () => {
  const barChartData = {
    labels: ["January", "February", "March", "April", "May"],
    datasets: [
      {
        label: "Monthly Sales",
        data: [15000, 18000, 22000, 25000, 21000],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: ["Rep 1", "Rep 2", "Rep 3", "Rep 4", "Rep 5"],
    datasets: [
      {
        label: "Rep Sales",
        data: [12000, 15000, 18000, 17000, 20000],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

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
              <p>120,000,000</p>
            </div>
            <div className="admin-dashboard-card">
              <ClipboardList className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Pending Orders</h3>
              <p>5,000,000</p>
            </div>
            <div className="admin-dashboard-card">
              <ShoppingBag className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Total Sales</h3>
              <p>20,850,000</p>
            </div>
            <div className="admin-dashboard-card">
              <Users className="admin-dashboard-icon" size={50} strokeWidth={1.5} />
              <h3>Number of Reps</h3>
              <p>50</p>
            </div>
          </div>

          <div className="admin-dashboard-charts">
            <div className="admin-dashboard-chart-container">
              <h3>Last 5 Months Sales</h3>
              <Bar data={barChartData} />
            </div>

            <div className="admin-dashboard-chart-container">
              <h3>Rep Sales Comparison</h3>
              <Line data={lineChartData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
