import React, { useState, useEffect } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ARouteDetails.css';

const ARouteDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repQuery, setRepQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [routeData, setRouteData] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:5000/api/routes') // Ensure you are pointing to the correct API endpoint
      .then((response) => {
        console.log('Response:', response); // This is useful for debugging
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched route data:', data); // Log the data to check what you get
        setRouteData(data);
      })
      .catch((error) => {
        console.error('Error fetching route data:', error);
      });
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRepChange = (e) => {
    setRepQuery(e.target.value);
  };

  const handleDateChange = (e) => {
    setDateQuery(e.target.value);
  };

  const handleSearch = () => {
    // Logic to filter routes based on search queries
    console.log('Search clicked:', searchQuery, repQuery, dateQuery);
  };

  const handleGenerateReport = () => {
    // Logic to generate report
    console.log('Generate Report clicked');
  };

  const handleMakeRoute = () => {
    // Logic to create new route
    console.log('Make Route clicked');
  };

  return (
    <div className="route-details-full-page">
      <ASidebar />

      <div className="content">
        <ANavbar />

        <div className="route-details-page-title">
          <h1>Route Details</h1>
        </div>

        <div className="route-details-search-container">
          <input
            className="route-details-search-input"
            type="text"
            placeholder="Search by Route ID..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <input
            className="route-details-search-input"
            type="text"
            placeholder="Search by Rep..."
            value={repQuery}
            onChange={handleRepChange}
          />
          <input
            className="route-details-search-input"
            type="date"
            placeholder="Search by Date..."
            value={dateQuery}
            onChange={handleDateChange}
          />
          <button
            className="route-details-search-button"
            onClick={handleSearch}
          >
            Search
          </button>
          <button
            className="route-details-report-button"
            onClick={handleGenerateReport}
          >
            Generate Report
          </button>
          <button
            className="route-details-make-route-button"
            onClick={handleMakeRoute}
          >
            Make Route
          </button>
        </div>

        <table className="route-details-table">
          <thead>
            <tr>
              <th>Route ID</th>
              <th>Rep Name</th>
              <th>Rep Major Area</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {routeData.length > 0 ? (
              routeData.map((route) => (
                <tr key={route.RouteID}>
                  <td>{route.RouteID}</td>
                  <td>{route.RepName}</td>
                  <td>{route.RouteArea}</td>
                  <td>{new Date(route.RouteDate).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No routes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ARouteDetails;
