import React from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import { Package, Box, Users, Pill, UserCheck } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "./MDashboard.css";

const MDashboard = () => {
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
    <div className="dashboard-container">
      <MNavbar />
      <div className="dashboard-content">
        <MSidebar />
        <div className="dashboard-main">
          <h1>Manager Dashboard</h1>
          <p>Welcome to the Manager Dashboard. Here you can manage operations efficiently.</p>

          <div className="dashboard-boxes">
            <div className="dashboard-box">
              <Package size={50} />
              <h3>Total Orders</h3>
              <p>150</p>
            </div>

            <div className="dashboard-box">
              <Box size={50} />
              <h3>Total Inventory</h3>
              <p>1200 Items</p>
            </div>

            <div className="dashboard-box">
              <Users size={50} />
              <h3>No. of Suppliers</h3>
              <p>25</p>
            </div>

            <div className="dashboard-box">
              <Pill size={50} />
              <h3>No. of Pharmacies</h3>
              <p>18</p>
            </div>

            <div className="dashboard-box">
              <UserCheck size={50} />
              <h3>No. of Reps</h3>
              <p>35</p>
            </div>
          </div>

          <div className="charts">
            <div className="chart-container">
              <h3>Last 5 Months Sales</h3>
              <Bar data={barChartData} />
            </div>

            <div className="chart-container">
              <h3>Rep Sales Comparison</h3>
              <Line data={lineChartData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDashboard;
