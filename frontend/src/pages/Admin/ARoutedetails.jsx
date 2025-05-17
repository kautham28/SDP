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
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [routeDetails, setRouteDetails] = useState({
    RepName: '',
    RouteDate: '',
    RouteArea: '',
    RepID: ''
  });
  const [selectedPharmacies, setSelectedPharmacies] = useState([]);
  const [newPharmacy, setNewPharmacy] = useState({
    PharmacyName: '',
    Address: '',
    GoogleMapLink: ''
  });
  const [customPharmacies, setCustomPharmacies] = useState([]);
  const [allReps, setAllReps] = useState([]);
  const [allPharmacies, setAllPharmacies] = useState([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');

  useEffect(() => {
    // Fetch routes data
    fetch('http://localhost:5000/api/routes')
      .then((response) => response.json())
      .then((data) => {
        setRouteData(data);
        setFilteredData(data);
      })
      .catch((error) => console.error('Error fetching route data:', error));
    
    // Fetch all representatives
    fetch('http://localhost:5000/users')
      .then((response) => response.json())
      .then((data) => {
        // Filter only users with 'Rep' role
        const reps = data.filter(user => user.role === 'Rep');
        setAllReps(reps);
      })
      .catch((error) => console.error('Error fetching representatives:', error));
    
    // Fetch all pharmacies
    fetch('http://localhost:5000/api/pharmacies/all-pharmacies')
      .then((response) => response.json())
      .then((data) => {
        setAllPharmacies(data);
      })
      .catch((error) => console.error('Error fetching pharmacies:', error));
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

  const handleCreateRouteClick = () => {
    setShowCreatePopup(true);
    setRouteDetails({
      RepName: '',
      RouteDate: '',
      RouteArea: '',
      RepID: ''
    });
    setSelectedPharmacies([]);
    setCustomPharmacies([]);
    setPharmacyData([]);
    setSelectedPharmacyId('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRouteDetails((prevState) => ({
      ...prevState,
      [name]: value
    }));

    if (name === 'RouteArea' && value.length > 2) {
      fetchPharmacyByMajorArea(value);
    }
  };

  const handleRepSelection = (e) => {
    const repUsername = e.target.value;
    const selectedRep = allReps.find(rep => rep.username === repUsername);
    
    if (selectedRep) {
      setRouteDetails(prevState => ({
        ...prevState,
        RepName: repUsername,
        RepID: selectedRep.id.toString()
      }));
    } else {
      setRouteDetails(prevState => ({
        ...prevState,
        RepName: repUsername,
        RepID: ''
      }));
    }
  };

  const handlePharmacyDropdownChange = (e) => {
    const pharmacyId = e.target.value;
    setSelectedPharmacyId(pharmacyId);
    
    if (pharmacyId) {
      const selectedPharmacy = allPharmacies.find(pharmacy => pharmacy.PharmacyID.toString() === pharmacyId);
      if (selectedPharmacy) {
        setNewPharmacy({
          PharmacyName: selectedPharmacy.PharmacyName,
          Address: selectedPharmacy.PharmacyLocation,
          GoogleMapLink: selectedPharmacy.LocationLink || `https://maps.google.com/?q=${encodeURIComponent(selectedPharmacy.PharmacyLocation)}`
        });
      }
    } else {
      setNewPharmacy({
        PharmacyName: '',
        Address: '',
        GoogleMapLink: ''
      });
    }
  };

  const handlePharmacyInputChange = (e) => {
    const { name, value } = e.target;
    setNewPharmacy((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const fetchPharmacyByMajorArea = (majorArea) => {
    fetch(`http://localhost:5000/api/pharmacies?area=${majorArea}`)
      .then((response) => response.json())
      .then((data) => {
        setPharmacyData(data);
      })
      .catch((error) => console.error('Error fetching pharmacies:', error));
  };

  const handlePharmacySelection = (pharmacy) => {
    setSelectedPharmacies((prevState) => {
      const exists = prevState.some(p => p.PharmacyID === pharmacy.PharmacyID);
      if (exists) {
        return prevState.filter((p) => p.PharmacyID !== pharmacy.PharmacyID);
      } else {
        return [...prevState, pharmacy];
      }
    });
  };

  const addPharmacyFromDropdown = () => {
    if (selectedPharmacyId && newPharmacy.PharmacyName) {
      const exists = selectedPharmacies.some(p => 
        p.PharmacyID === selectedPharmacyId || p.PharmacyName === newPharmacy.PharmacyName
      );
      
      if (!exists) {
        const selectedPharmacy = allPharmacies.find(pharmacy => pharmacy.PharmacyID.toString() === selectedPharmacyId);
        const pharmacyToAdd = {
          PharmacyID: selectedPharmacyId,
          PharmacyName: newPharmacy.PharmacyName,
          Address: selectedPharmacy.PharmacyLocation,
          GoogleMapLink: selectedPharmacy.LocationLink || `https://maps.google.com/?q=${encodeURIComponent(selectedPharmacy.PharmacyLocation)}`
        };
        
        setSelectedPharmacies([...selectedPharmacies, pharmacyToAdd]);
      }
      
      setSelectedPharmacyId('');
      setNewPharmacy({
        PharmacyName: '',
        Address: '',
        GoogleMapLink: ''
      });
    }
  };

  const addCustomPharmacy = () => {
    if (newPharmacy.PharmacyName && newPharmacy.Address) {
      const exists = selectedPharmacies.some(p => p.PharmacyName === newPharmacy.PharmacyName);
      
      if (!exists) {
        const customPharmacy = {
          ...newPharmacy,
          PharmacyID: `custom-${Date.now()}`
        };
        
        setCustomPharmacies([...customPharmacies, customPharmacy]);
        setSelectedPharmacies([...selectedPharmacies, customPharmacy]);
      }
      
      setNewPharmacy({
        PharmacyName: '',
        Address: '',
        GoogleMapLink: ''
      });
      setSelectedPharmacyId('');
    }
  };

  const removeSelectedPharmacy = (pharmacyID) => {
    setSelectedPharmacies(selectedPharmacies.filter(p => p.PharmacyID !== pharmacyID));
    
    if (typeof pharmacyID === 'string' && pharmacyID.startsWith('custom-')) {
      setCustomPharmacies(customPharmacies.filter(p => p.PharmacyID !== pharmacyID));
    }
  };

  const handleSubmitRoute = () => {
    if (!routeDetails.RepName || !routeDetails.RouteDate || !routeDetails.RouteArea || !routeDetails.RepID) {
      alert('Please fill in all route details');
      return;
    }

    if (selectedPharmacies.length === 0) {
      alert('Please select at least one pharmacy');
      return;
    }

    const routePayload = {
      RepName: routeDetails.RepName,
      RouteDate: routeDetails.RouteDate,
      RouteArea: routeDetails.RouteArea,
      RepID: parseInt(routeDetails.RepID),
      pharmacies: selectedPharmacies.map(pharmacy => ({
        PharmacyName: pharmacy.PharmacyName,
        Address: pharmacy.Address,
        GoogleMapLink: pharmacy.GoogleMapLink || `https://maps.google.com/?q=${encodeURIComponent(pharmacy.Address)}`
      }))
    };

    fetch('http://localhost:5000/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routePayload),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setRouteData([...routeData, data]);
        setShowCreatePopup(false);
        setRouteDetails({
          RepName: '',
          RouteDate: '',
          RouteArea: '',
          RepID: ''
        });
        setSelectedPharmacies([]);
        setCustomPharmacies([]);
        alert('Route created successfully!');
      })
      .catch((error) => {
        console.error('Error creating route:', error);
        alert('Failed to create route. Please try again.');
      });
  };

  return (
    <div className="route-details-page-container">
      <ASidebar />
      <div className="route-details-main-content">
        <ANavbar />
        <div className="Aroute-details-header">
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
          <button className="route-details-make-route-button" onClick={handleCreateRouteClick}>
            Create Route
          </button>
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
                      <td>{pharmacy.PharmacyLocation || pharmacy.Address}</td>
                      <td>
                        <a
                          href={pharmacy.LocationLink || pharmacy.GoogleMapLink}
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

      {showCreatePopup && (
        <div className="popup-overlay">
          <div className="popup-content create-route-popup">
            <h2>Create New Route</h2>
            
            <div className="create-route-form">
              <div className="form-group">
                <label>Representative Name:</label>
                <select
                  name="RepName"
                  value={routeDetails.RepName}
                  onChange={handleRepSelection}
                  className="select-dropdown"
                >
                  <option value="">Select Representative</option>
                  {allReps.map(rep => (
                    <option key={rep.id} value={rep.username}>
                      {rep.username}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Representative ID:</label>
                <input
                  type="text"
                  name="RepID"
                  value={routeDetails.RepID}
                  readOnly
                  className="readonly-input"
                  placeholder="Auto-filled when rep is selected"
                />
              </div>
              
              <div className="form-group">
                <label>Route Date:</label>
                <input
                  type="date"
                  name="RouteDate"
                  value={routeDetails.RouteDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Major Area:</label>
                <input
                  type="text"
                  name="RouteArea"
                  value={routeDetails.RouteArea}
                  onChange={handleInputChange}
                  placeholder="Enter major area (e.g., Colombo)"
                />
              </div>
            </div>

            <div className="pharmacy-selection-section">
              <h3>Select Pharmacies</h3>
              
              <div className="pharmacy-dropdown-selection">
                <h4>Select from existing pharmacies</h4>
                <div className="pharmacy-dropdown-row">
                  <div className="form-group">
                    <select
                      value={selectedPharmacyId}
                      onChange={handlePharmacyDropdownChange}
                      className="select-dropdown"
                    >
                      <option value="">Select Pharmacy</option>
                      {allPharmacies.map(pharmacy => (
                        <option key={pharmacy.PharmacyID} value={pharmacy.PharmacyID}>
                          {pharmacy.PharmacyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button 
                    className="add-pharmacy-button"
                    onClick={addPharmacyFromDropdown}
                    disabled={!selectedPharmacyId}
                  >
                    Add Selected Pharmacy
                  </button>
                </div>
                
                <div className="pharmacy-details-preview">
                  {newPharmacy.PharmacyName && (
                    <>
                      <div className="form-group">
                        <label>Address:</label>
                        <input
                          type="text"
                          value={newPharmacy.Address}
                          readOnly
                          className="readonly-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Google Maps Link:</label>
                        <input
                          type="text"
                          value={newPharmacy.GoogleMapLink}
                          readOnly
                          className="readonly-input"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="add-custom-pharmacy">
                <h4>Add New Pharmacy</h4>
                <div className="custom-pharmacy-form">
                  <div className="form-group">
                    <input
                      type="text"
                      name="PharmacyName"
                      value={newPharmacy.PharmacyName}
                      onChange={handlePharmacyInputChange}
                      placeholder="Pharmacy Name"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="Address"
                      value={newPharmacy.Address}
                      onChange={handlePharmacyInputChange}
                      placeholder="Address"
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="GoogleMapLink"
                      value={newPharmacy.GoogleMapLink}
                      onChange={handlePharmacyInputChange}
                      placeholder="Google Maps Link (optional)"
                    />
                  </div>
                  <button 
                    className="add-pharmacy-button" 
                    onClick={addCustomPharmacy}
                    disabled={!newPharmacy.PharmacyName || !newPharmacy.Address}
                  >
                    Add New Pharmacy
                  </button>
                </div>
              </div>

              <div className="selected-pharmacies">
                <h4>Selected Pharmacies</h4>
                {selectedPharmacies.length > 0 ? (
                  <div className="selected-pharmacy-list">
                    {selectedPharmacies.map((pharmacy) => (
                      <div key={pharmacy.PharmacyID} className="selected-pharmacy-item">
                        <span><strong>{pharmacy.PharmacyName}</strong> - {pharmacy.Address}</span>
                        <button 
                          className="remove-pharmacy-button"
                          onClick={() => removeSelectedPharmacy(pharmacy.PharmacyID)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No pharmacies selected yet</p>
                )}
              </div>
            </div>

            <div className="popup-buttons">
              <button 
                className="submit-button" 
                onClick={handleSubmitRoute}
                disabled={!routeDetails.RepName || !routeDetails.RouteDate || !routeDetails.RouteArea || selectedPharmacies.length === 0}
              >
                Create Route
              </button>
              <button className="cancel-button" onClick={() => setShowCreatePopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARouteDetails;