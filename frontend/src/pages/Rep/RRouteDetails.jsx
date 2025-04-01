// src/components/Rep/RRouteDetails.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import { useNavigate } from "react-router-dom"; 
import { Eye } from "lucide-react";
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
        <div className="route-details-page-container">
            <RNavbar />
            <div className="route-details-sidebar">
                <RSidebar />
            </div>
            <div className="route-details-main-content">
                <div className="route-details-header">
                    <h1>Route Details</h1>
                    <p>Check and update route details.</p>
                </div>
                
                {loading && <p>Loading routes...</p>}
                {error && <p>{error}</p>}

                {!loading && !error && routes.length > 0 ? (
                    <div className="route-details-table-container">
                        <table className="route-details-table">
                            <thead>
                                <tr>
                                    <th>Route ID</th>
                                    <th>Rep Name</th>
                                    <th>Route Date</th>
                                    <th>Major Area</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routes.map((route) => (
                                    <tr key={route.RouteID}>
                                        <td>{route.RouteID}</td>
                                        <td>{route.RepName}</td>
                                        <td>{new Date(route.RouteDate).toLocaleDateString()}</td>
                                        <td>{route.RouteArea}</td>
                                        <td className="action-buttons-route">
                                            <button className="view-route" onClick={() => viewRouteDetails(route.RouteID)}>
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No routes found.</p>
                )}

                {/* Popup for showing route details */}
                {isPopupVisible && selectedRoute && (
                    <div className="popup-overlay">
                        <div className="popup-content">
                            <h2>Pharmacy Details</h2>
                            
                            <table className="pharmacy-details-table">
                                <thead>
                                    <tr>
                                        <th>Pharmacy Name</th>
                                        <th>Address</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRoute.map((pharmacy, index) => (
                                        <tr key={index}>
                                            <td>{pharmacy.PharmacyName}</td>
                                            <td>{pharmacy.Address}</td>
                                            <td>
                                                <a href={pharmacy.GoogleMapLink} target="_blank" rel="noopener noreferrer" className="pharmacy-location-link">
                                                    View on Map
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <button className="close-button" onClick={closePopup}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RRouteDetails;