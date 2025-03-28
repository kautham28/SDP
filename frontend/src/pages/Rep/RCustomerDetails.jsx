import React, { useState, useEffect } from 'react';
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import './RCustomerDetails.css';

const RCustomerDetails = () => {
  const [pharmacies, setPharmacies] = useState([]); // State to store pharmacies data
  const [loading, setLoading] = useState(true); // State for loading status
  const [error, setError] = useState(null); // State for handling errors

  useEffect(() => {
    // Fetching data from the API
    const fetchPharmacies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/pharmacies/all-pharmacies');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setPharmacies(data); // Setting the fetched data to state
      } catch (error) {
        setError(error.message); // If error occurs, set error message to state
      } finally {
        setLoading(false); // Set loading to false once data is fetched or error occurs
      }
    };

    fetchPharmacies(); // Call the function to fetch data
  }, []); // Empty dependency array means this effect runs only once, when the component mounts

  if (loading) {
    return <div>Loading...</div>; // Loading state message
  }

  if (error) {
    return <div>Error: {error}</div>; // Error message
  }

  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <h1>Customer Details</h1>
        <p>Manage customer information.</p>

        <h2>Pharmacies List</h2>
        <table className="pharmacies-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th> {/* Add other columns based on your data */}
            </tr>
          </thead>
          <tbody>
            {pharmacies.map((pharmacy) => (
              <tr key={pharmacy.PharmacyID}>
                <td>{pharmacy.PharmacyName}</td> {/* Assuming 'id' is a property in your data */}
                <td>{pharmacy.OwnerName}</td> {/* Assuming 'name' is a property in your data */}
                <td>{pharmacy.OwnerEmail}</td> {/* Assuming 'address' is a property in your data */}
                <td>{pharmacy.OwnerContact}</td> {/* Add any other properties as needed */}
                <td>{pharmacy.PharmacyLocation}</td> {/* Add any other properties as needed */}
                <td>{pharmacy.LocationLink}</td> {/* Add any other properties as needed */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RCustomerDetails;
