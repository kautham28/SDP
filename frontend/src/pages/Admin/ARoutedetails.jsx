import React, { useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import './ARouteDetails.css';

const ARouteDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repQuery, setRepQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [routeData, setRouteData] = useState([
    // Sample data (Replace with real data)
    { id: 1, rep: 'Rep A', majorArea: 'Area 1', date: '2025-03-01' },
    { id: 2, rep: 'Rep B', majorArea: 'Area 2', date: '2025-04-15' },
    { id: 3, rep: 'Rep C', majorArea: 'Area 3', date: '2025-06-20' },
    { id: 4, rep: 'Rep D', majorArea: 'Area 4', date: '2025-02-28' },
    { id: 5, rep: 'Rep E', majorArea: 'Area 5', date: '2025-05-10' },
  ]);

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
      {/* Sidebar */}
      <ASidebar />

      <div className="content">
        {/* Navbar */}
        <ANavbar />

        {/* Page Content */}
        <div className="route-details-page-title">
          <h1>Route Details</h1>
        </div>

        {/* Search Filters Row */}
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

        {/* Table */}
        <table className="route-details-table">
          <thead>
            <tr>
              <th>Route ID</th>
              <th>Rep Name</th> {/* Added Rep Name column */}
              <th>Rep Major Area</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {routeData.map((route) => (
              <tr key={route.id}>
                <td>{route.id}</td>
                <td>{route.rep}</td> {/* Added Rep Name in table */}
                <td>{route.majorArea}</td>
                <td>{route.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ARouteDetails;
