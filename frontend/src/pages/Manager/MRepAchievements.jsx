import React from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import RepAchievementCard from "../../components/Manager/RepAchievementCard";
import "./MRepAchievements.css";

const repsData = [
  {
    name: "John Doe",
    photo:  "/src/assets/admin.jpeg",
    lastMonthSales: 5000,
    currentMonthSales: 8000,
    salesTarget: 12000,
  },
  {
    name: "Jane Smith",
    photo: "/images/jane.jpg",
    lastMonthSales: 6000,
    currentMonthSales: 7000,
    salesTarget: 11000,
  },
  {
    name: "Mike Johnson",
    photo: "/images/mike.jpg",
    lastMonthSales: 4000,
    currentMonthSales: 6500,
    salesTarget: 10000,
  },
  {
    name: "Emily Davis",
    photo: "/images/emily.jpg",
    lastMonthSales: 7000,
    currentMonthSales: 9000,
    salesTarget: 13000,
  },
];

const MRepAchievements = () => {
  return (
    <div className="rep-achievements-container">
      <MNavbar />
      <div className="rep-achievements-content">
        <MSidebar />
        <div className="rep-achievements-main">
          <h1>Rep Achievements</h1>
          <p>View and manage representative achievements.</p>

          <div className="rep-achievements-list">
            {repsData.map((rep, index) => (
              <RepAchievementCard key={index} rep={rep} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRepAchievements;
