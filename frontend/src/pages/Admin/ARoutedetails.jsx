import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ARouteDetails.css';

const ARouteDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repQuery, setRepQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [routeData, setRouteData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [pharmacyData, setPharmacyData] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/routes')
      .then((response) => response.json())
      .then((data) => {
        setRouteData(data);
        setFilteredData(data);
      })
      .catch((error) => console.error('Error fetching route data:', error));
  }, []);

  useEffect(() => {
    const filtered = routeData.filter((route) => {
      return (
        (searchQuery === '' || route.RouteID.toString().includes(searchQuery)) &&
        (repQuery === '' || route.RepName.toLowerCase().includes(repQuery.toLowerCase())) &&
        (dateQuery === '' || new Date(route.RouteDate).toISOString().split('T')[0] === dateQuery)
      );
    });
    setFilteredData(filtered);
  }, [searchQuery, repQuery, dateQuery, routeData]);

  const fetchPharmacyDetails = (routeID) => {
    fetch(`http://localhost:5000/api/routes/${routeID}/pharmacies`)
      .then((response) => response.json())
      .then((data) => {
        setPharmacyData(data);
        setShowPopup(true);
      })
      .catch((error) => console.error('Error fetching pharmacy data:', error));
  };

  return (
    <div className="route-details-page-container">
      <ASidebar />
      <div className="route-details-main-content">
        <ANavbar />
        <div className="route-details-header">
          <h1>Route Details</h1>
        </div>
        <div className="route-details-filters">
          <input
            className="route-details-input"
            type="text"
            placeholder="Search by Route ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            className="route-details-input"
            type="text"
            placeholder="Search by Rep..."
            value={repQuery}
            onChange={(e) => setRepQuery(e.target.value)}
          />
          <input
            className="route-details-input"
            type="date"
            value={dateQuery}
            onChange={(e) => setDateQuery(e.target.value)}
          />
          <button className="route-details-make-route-button">Create Route</button>
          <button className="route-details-report-button">Generate Report</button>
        </div>

        <table className="route-details-table">
          <thead>
            <tr>
              <th>Route ID</th>
              <th>Rep Name</th>
              <th>Rep Major Area</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((route) => (
                <tr key={route.RouteID}>
                  <td>{route.RouteID}</td>
                  <td>{route.RepName}</td>
                  <td>{route.RouteArea}</td>
                  <td>{new Date(route.RouteDate).toLocaleDateString()}</td>
                  <td>
                    <button className="route-details-view-button" onClick={() => fetchPharmacyDetails(route.RouteID)}>
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No routes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Popup for displaying pharmacy details */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Pharmacy List</h2>
            <table className="pharmacy-table">
              <thead>
                <tr>
                  <th>Pharmacy Name</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyData.length > 0 ? (
                  pharmacyData.map((pharmacy) => (
                    <tr key={pharmacy.PharmacyID}>
                      <td>{pharmacy.PharmacyName}</td>
                      <td>{pharmacy.Address}</td>
                      <td>
                        <a 
                          href={pharmacy.GoogleMapLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="pharmacy-location-link"
                        >
                          View Location
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No pharmacies found</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="close-button" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARouteDetails;
