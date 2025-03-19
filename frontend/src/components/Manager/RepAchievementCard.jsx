import React from "react";
import { Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import "./RepAchievementCard.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const RepAchievementCard = ({ rep }) => {
  const completedPercentage = Math.round((rep.currentMonthSales / rep.salesTarget) * 100);

  const pieData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [rep.currentMonthSales, rep.salesTarget - rep.currentMonthSales],
        backgroundColor: ["#00C49F", "#FF8042"],
      },
    ],
  };

  const lineData = {
    labels: ["Last Month", "This Month"],
    datasets: [
      {
        label: "Sales",
        data: [rep.lastMonthSales, rep.currentMonthSales],
        borderColor: "#8884d8",
        backgroundColor: "rgba(136, 132, 216, 0.2)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  return (
    <div className="rep-card-container">
      <div className="rep-card">
        <div className="rep-header">
          <img src={rep.photo} alt={rep.name} className="rep-photo" />
          <h3>{rep.name}</h3>
        </div>

        <div className="charts-container">
          <div className="chart-container">
            <h4>Sales Completion</h4>
            <Pie data={pieData} />
          </div>

          <div className="chart-container">
            <h4>Sales Trend</h4>
            <Line data={lineData} />
          </div>
        </div>

        <div className="sales-details">
          <p>Last Month Sales: <strong>${rep.lastMonthSales}</strong></p>
          <p>Current Month Sales: <strong>${rep.currentMonthSales}</strong></p>
          <p>Sales Target: <strong>${rep.salesTarget}</strong></p>
          <p>Completed: <strong>{completedPercentage}%</strong></p>
        </div>
      </div>
    </div>
  );
};

export default RepAchievementCard;
