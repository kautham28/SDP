import React from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import ktmImage from "../../assets/ktm.jpg";
import kamalImage from "../../assets/kamal.png";
import kauthamanImage from "../../assets/kauthaman.png";

const RepAchievementCard = ({ rep, onMonthYearChange }) => {
  const percentage = rep.percentage || 0;
  const id = rep.id || "N/A";
  const name = rep.name || `Rep ${id}`;
  const salesTarget = rep.salesTarget || 0;
  const currentMonthSales = rep.currentMonthSales || 0;
  const month = rep.month || "";
  const year = rep.year || "";

  const data = {
    labels: ["Achieved", "Remaining"],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: ["#36A2EB", "#E0E0E0"],
        hoverBackgroundColor: ["#36A2EB", "#E0E0E0"],
      },
    ],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "month" || name === "year") {
      const newMonth = name === "month" ? value : month;
      const newYear = name === "year" ? value : year;
      onMonthYearChange(rep, newYear, newMonth);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const imageMap = {
    "ktm.jpg": ktmImage,
    "kamal.png": kamalImage,
    "kauthaman.png": kauthamanImage,
  };

  const filename = rep.photo_link ? rep.photo_link.split("/").pop() : null;
  const imageUrl = filename && imageMap[filename]
    ? imageMap[filename]
    : "https://placehold.co/150?text=No+Image";

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        backgroundColor: "#e6f7ff",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Representative Info with Month/Year Selection */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ width: "50px", height: "50px", overflow: "hidden", borderRadius: "50%" }}>
          <img
            src={imageUrl}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.src = "https://placehold.co/50?text=No+Image";
              console.error(`Failed to load image for RepID ${id}: ${imageUrl}.`);
            }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0", fontSize: "18px" }}>{name}</h3>
            <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>ID: {id}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              name="month"
              value={month}
              onChange={handleChange}
              style={{
                padding: "4px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="year"
              value={year}
              onChange={handleChange}
              style={{
                padding: "4px",
                width: "80px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Sales Data */}
      <div>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>This Month Target:</strong> {salesTarget.toLocaleString()}
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Sales:</strong> {currentMonthSales.toLocaleString()}
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Achieved Percentage:</strong> {percentage}%
        </p>
      </div>

      {/* Pie Chart */}
      <div style={{ width: "100%", height: "150px" }}>
        <Pie data={data} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default RepAchievementCard;