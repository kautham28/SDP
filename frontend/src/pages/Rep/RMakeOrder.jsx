import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import RNavbar from "../../components/Rep/RNavbar";
import RSidebar from "../../components/Rep/RSidebar";
import MedicineCard from "../../components/Rep/MedicineCard";
import "./RMakeOrder.css";
import axios from "axios";

const RMakeOrder = () => {
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    axios.get("http://localhost:5000/api/admin/products")
      .then((response) => {
        setMedicines(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/pharmacies/all-pharmacies")
      .then((response) => {
        setPharmacies(response.data);
      })
      .catch((error) => {
        console.error("Error fetching pharmacies:", error);
      });
  }, []);

  // Show the popup when 'Add to Cart' is clicked
  const handleOpenPopup = (medicine) => {
    setSelectedMedicine(medicine);
    setShowPopup(true);
  };

  // Close the popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setQuantity(1);
  };

  // Handle adding the selected medicine to cart
  const handleConfirmAddToCart = () => {
    if (!selectedMedicine) return;

    const updatedCart = [...cart, { ...selectedMedicine, quantity }];
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart)); // Save to local storage

    handleClosePopup(); // Close popup after adding to cart
    navigate("/rep/view-cart"); // Redirect to View Cart page
  };

  return (
    <div className="dashboard-container">
      <RNavbar />
      <RSidebar />
      <div className="dashboard-content">
        <div className="heading-container">
          <h1>Make Order</h1>
        </div>

        <div className="pharmacy-select">
          <label htmlFor="pharmacy">Select Pharmacy: </label>
          <select
            id="pharmacy"
            name="pharmacy"
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
          >
            <option value="">Select a Pharmacy</option>
            {pharmacies.map((pharmacy) => (
              <option key={pharmacy.PharmacyID} value={pharmacy.PharmacyID}>
                {pharmacy.PharmacyName}
              </option>
            ))}
          </select>
        </div>

        <div className="view-cart-button">
          <button onClick={() => navigate("/rep/view-cart")}>
            View Cart
          </button>
        </div>

        <div className="medicine-grid">
          {loading ? (
            <p>Loading medicines...</p>
          ) : (
            medicines.map((med, index) => (
              <MedicineCard key={index} medicine={med} onAddToCart={() => handleOpenPopup(med)} />
            ))
          )}
        </div>

        {/* Popup for Quantity Selection */}
        {showPopup && (
          <div className="popup">
            <div className="popup-content">
              <h2>{selectedMedicine?.name}</h2>
              <label>Enter Quantity:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <div className="popup-buttons">
                <button onClick={handleConfirmAddToCart}>Confirm</button>
                <button onClick={handleClosePopup}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RMakeOrder;
