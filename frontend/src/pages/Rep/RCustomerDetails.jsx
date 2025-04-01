import React, { useEffect, useState } from 'react';
import RSidebar from '../../components/Rep/RSidebar';
import RNavbar from '../../components/Rep/RNavbar';
import axios from 'axios';
import './RCustomerDetails.css';

// Custom Components
const Input = ({ type, placeholder, className, onChange }) => (
  <input type={type} placeholder={placeholder} className={`custom-input ${className}`} onChange={onChange} />
);
const Table = ({ children }) => <table className="custom-table">{children}</table>;
const TableHead = ({ children }) => <thead className="table-head">{children}</thead>;
const TableRow = ({ children }) => <tr className="table-row">{children}</tr>;
const TableHeader = ({ children }) => <th className="table-header">{children}</th>;
const TableBody = ({ children }) => <tbody className="table-body">{children}</tbody>;
const TableCell = ({ children }) => <td className="table-cell">{children}</td>;

const RCustomerDetails = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch confirmed orders from backend
    axios.get('http://localhost:5000/api/pharmacies/all-pharmacies')
      .then(response => {
        setPharmacies(response.data);
      })
      .catch(error => {
        console.error("There was an error fetching the pharmacies!", error);
      });
  }, []);

  // Filtered pharmacies based on search input
  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.PharmacyName.toLowerCase().includes(search.toLowerCase()) ||
    pharmacy.OwnerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rep-layout">
      <RSidebar />
      <div className="content">
        <RNavbar />
        <div className="page-content">
          <h1 className="page-title">Customer Details</h1>

          {/* Search Filters */}
          <div className="search-filters">
            <Input type="text" placeholder="Search by Pharmacy Name or Owner Name" className="search-input" onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Pharmacies Table */}
          <div className="table-container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Pharmacy Name</TableHeader>
                  <TableHeader>Owner Name</TableHeader>
                  <TableHeader>Owner Email</TableHeader>
                  <TableHeader>Owner Contact</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy.PharmacyID}>
                    <TableCell>{pharmacy.PharmacyName}</TableCell>
                    <TableCell>{pharmacy.OwnerName}</TableCell>
                    <TableCell>{pharmacy.OwnerEmail}</TableCell>
                    <TableCell>{pharmacy.OwnerContact}</TableCell>
                    <TableCell>
                      {pharmacy.LocationLink ? (
                        <a
                          href={pharmacy.LocationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-button"
                        >
                          View Location
                        </a>
                      ) : (
                        <span className="no-location">No Location</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RCustomerDetails;