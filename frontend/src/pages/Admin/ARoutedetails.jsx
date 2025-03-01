import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react'; // Importing Eye icon from Lucide React
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ARouteDetails.css';

const ARouteDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repQuery, setRepQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [routeData, setRouteData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/routes') 
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setRouteData(data);
        setFilteredData(data);
      })
      .catch((error) => {
        console.error('Error fetching route data:', error);
      });
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
              <th>Action</th> {/* Added Action column */}
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
                    {/* View button with eye icon */}
                    <button className="route-details-view-button">
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
    </div>
  );
};

export default ARouteDetails;
