import React, { useState, useEffect } from "react";
import axios from "axios";
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import { useNavigate } from "react-router-dom"; 
import "./RRouteDetails.css";

const RRouteDetails = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null); // State to hold selected route details
  const [isPopupVisible, setIsPopupVisible] = useState(false); // State to control popup visibility
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRouteData = async () => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        console.error("No token found! Redirecting to login...");
        window.location.href = "/login";
        return;
      }

      const userID = sessionStorage.getItem("userID");

      if (!userID) {
        console.error("No User ID found! Redirecting to login...");
        window.location.href = "/login";
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/routes/rep/${userID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRoutes(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching route data:", error);
        setError("Failed to fetch route data.");
        setLoading(false);
      }
    };

    fetchRouteData();
  }, []);

  // Function to handle "View" button click and fetch route details for the selected route
  const viewRouteDetails = async (routeID) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/routes/${routeID}/pharmacies`
      );
      setSelectedRoute(response.data); // Set the route details in state
      setIsPopupVisible(true); // Show the popup
    } catch (error) {
      console.error("Error fetching route details:", error);
      setError("Failed to fetch route details.");
    }
  };

  // Function to close the popup
  const closePopup = () => {
    setIsPopupVisible(false);
    setSelectedRoute(null);
  };

  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Route Details</h1>
        <p>Check and update route details.</p>
        
        {loading && <p>Loading routes...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && routes.length > 0 ? (
          <div className="route-list">
            {routes.map((route) => (
              <div key={route.RouteID} className="route-item">
                <h2>{route.RouteID}</h2>
                <p><strong>Rep Name:</strong> {route.RepName}</p>
                <p><strong>Route Area:</strong> {route.RouteArea}</p>
                <p><strong>Route Date:</strong> {new Date(route.RouteDate).toLocaleDateString()}</p>
                <button onClick={() => viewRouteDetails(route.RouteID)}>View</button> {/* View button */}
              </div>
            ))}
          </div>
        ) : (
          <p>No routes found.</p>
        )}

        {/* Popup for showing route details */}
        {isPopupVisible && selectedRoute && (
          <div className="popup-overlay">
            <div className="popup">
              <h2>Pharmacy Details</h2>
              
              {selectedRoute.map((pharmacy, index) => (
                <div key={index}>
                  <p><strong>Pharmacy Name:</strong> {pharmacy.PharmacyName}</p>
                  <p><strong>Address:</strong> {pharmacy.Address}</p>
                  <p><strong>Google Map Link:</strong> <a href={pharmacy.GoogleMapLink} target="_blank" rel="noopener noreferrer">{pharmacy.GoogleMapLink}</a></p>
                  <hr />
                </div>
              ))}
              
              <button onClick={closePopup}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RRouteDetails;
