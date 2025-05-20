import React, { useEffect, useState } from "react";
import axios from "axios";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import RepAchievementCard from "../../components/Manager/RepAchievementCard";
import "./MRepAchievements.css";

const getCurrentMonthYear = () => {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  return { month, year };
};

export default function MRepAchievements() {
  const [repsData, setRepsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState({
    RepID: "",
    Month: "",
    Year: "",
    Target: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { month, year } = getCurrentMonthYear();
      try {
        const achRes = await axios.get("http://localhost:5000/api/achievements");
        const achievements = achRes.data;

        const repMap = {};
        achievements.forEach((ach) => {
          if (!repMap[ach.RepID]) {
            repMap[ach.RepID] = {
              id: ach.RepID,
              name: ach.name || `Rep ${ach.RepID}`,
              photo_link: ach.photo_link || null,
              achievements: [],
            };
          }
          repMap[ach.RepID].achievements.push(ach);
        });
        const reps = Object.values(repMap);

        const data = reps.map((rep) => {
          const achForRep = rep.achievements.find(
            (ach) =>
              ach.Year === year &&
              (ach.Month.toLowerCase() === month.toLowerCase() ||
                ach.Month.includes(month.slice(0, 3)))
          );
          return {
            id: rep.id,
            name: rep.name,
            photo_link: rep.photo_link,
            currentMonthSales: achForRep ? achForRep.TotalSales : 0,
            salesTarget: achForRep ? achForRep.Target : 0,
            percentage: achForRep ? achForRep.percentage : 0,
            year,
            month,
          };
        });

        setRepsData(data);
      } catch (err) {
        console.error("Error fetching achievements:", err.message);
        setRepsData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleMonthYearChange = async (rep, year, month) => {
    try {
      const res = await axios.get("http://localhost:5000/api/achievements");
      const achievements = res.data;
      const achForRep = achievements.find(
        (ach) =>
          ach.RepID === rep.id &&
          ach.Year === parseInt(year) &&
          (ach.Month.toLowerCase() === month.toLowerCase() ||
            ach.Month.includes(month.slice(0, 3)))
      );
      setRepsData((prev) =>
        prev.map((r) =>
          r.id === rep.id
            ? {
                ...r,
                currentMonthSales: achForRep ? achForRep.TotalSales : 0,
                salesTarget: achForRep ? achForRep.Target : 0,
                percentage: achForRep ? achForRep.percentage : 0,
                year,
                month,
              }
            : r
        )
      );
    } catch (err) {
      console.error(`Error updating data for RepID ${rep.id}:`, err);
      setRepsData((prev) =>
        prev.map((r) =>
          r.id === rep.id
            ? {
                ...r,
                currentMonthSales: 0,
                salesTarget: 0,
                percentage: 0,
                year,
                month,
              }
            : r
        )
      );
    }
  };

  const handleTargetChange = (e) => {
    setTargetData({ ...targetData, [e.target.name]: e.target.value });
  };

  const handleTargetSubmit = async (e) => {
    e.preventDefault();
    const formattedData = {
      ...targetData,
      Target: parseFloat(targetData.Target) || 0,
      Year: parseInt(targetData.Year) || 0,
      RepID: parseInt(targetData.RepID) || 0,
    };
    try {
      await axios.post("http://localhost:5000/api/achievements", formattedData);
      alert("Target posted successfully!");
      const achRes = await axios.get("http://localhost:5000/api/achievements");
      const achievements = achRes.data;
      setRepsData((prev) =>
        prev.map((rep) => {
          const achForRep = achievements.find(
            (ach) =>
              ach.RepID === rep.id &&
              ach.Year === parseInt(rep.year) &&
              (ach.Month.toLowerCase() === rep.month.toLowerCase() ||
                ach.Month.includes(rep.month.slice(0, 3)))
          );
          return {
            ...rep,
            currentMonthSales: achForRep ? achForRep.TotalSales : 0,
            salesTarget: achForRep ? achForRep.Target : 0,
            percentage: achForRep ? achForRep.percentage : 0,
          };
        })
      );
    } catch (err) {
      alert(
        "Error posting target: " + (err.response?.data?.error || err.message)
      );
    }
  };

  return (
    <div className="rep-achievements-container">
      <MNavbar />
      <div className="rep-achievements-content" style={{ display: "flex" }}>
        <MSidebar />
        <div className="rep-achievements-main" style={{ flex: 1, padding: "2rem" }}>
          {/* Title and Subtitle */}
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Sales Representatives Dashboard
          </h1>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            Monthly sales performance tracking
          </p>

          {/* Grid for Rep Cards */}
          <div
            className="rep-achievements-list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {loading ? (
              <div>Loading...</div>
            ) : repsData.length === 0 ? (
              <div>No representatives or achievements found.</div>
            ) : (
              repsData.map((rep) => (
                <RepAchievementCard
                  key={rep.id}
                  rep={rep}
                  onMonthYearChange={handleMonthYearChange}
                />
              ))
            )}
          </div>

          {/* Manager Target Post Form (Moved to Sidebar or Bottom) */}
          {/* For simplicity, let's place it below the grid for now */}
          <div style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Post Next Month Target
            </h2>
            <form
              className="manager-target-form"
              onSubmit={handleTargetSubmit}
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                padding: "1rem",
                border: "1px solid #ccc",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <input
                type="number"
                name="RepID"
                placeholder="RepID"
                value={targetData.RepID}
                onChange={handleTargetChange}
                required
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "120px",
                }}
              />
              <input
                type="text"
                name="Month"
                placeholder="Month (e.g., April)"
                value={targetData.Month}
                onChange={handleTargetChange}
                required
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "150px",
                }}
              />
              <input
                type="number"
                name="Year"
                placeholder="Year"
                value={targetData.Year}
                onChange={handleTargetChange}
                required
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "100px",
                }}
              />
              <input
                type="number"
                name="Target"
                placeholder="Target"
                value={targetData.Target}
                onChange={handleTargetChange}
                required
                style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "120px",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#003f4f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Post Target
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}