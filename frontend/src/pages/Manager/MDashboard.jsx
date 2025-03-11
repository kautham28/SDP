import React from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import { Package, Box, Users, Pill, UserCheck } from "lucide-react";
import "./MDashboard.css";

const MDashboard = () => {
  return (
    <div className="dashboard-container">
      <MNavbar />
      <div className="dashboard-content">
        <MSidebar />
        <div className="dashboard-main">
          <h1>Manager Dashboard</h1>
          <p>Welcome to the Manager Dashboard. Here you can manage operations efficiently.</p>

          {/* Statistics Boxes */}
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
        </div>
      </div>
    </div>
  );
};

export default MDashboard;
