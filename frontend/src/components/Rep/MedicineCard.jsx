import React from "react";
import "./MedicineCard.css";

const MedicineCard = ({ medicine, onAddToCart }) => {
  const {
    Name = "Unnamed",
    GenericName = "N/A",
    UnitPrice,
    ExpiryDate = "N/A",
    Quantity = "N/A",
    ImagePath
  } = medicine || {};

  // Format ExpiryDate to readable format (only if valid date)
  let formattedExpiry = "N/A";
  if (ExpiryDate && !isNaN(Date.parse(ExpiryDate))) {
    formattedExpiry = new Date(ExpiryDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  return (
    <div className="medicine-card">
      {/* Render image or placeholder */}
      <img
        src={ImagePath || "https://via.placeholder.com/150x100?text=No+Image"}
        alt={Name}
        className="medicine-image"
      />

      <div className="medicine-info">
        <h3>{Name}</h3>
        <p><strong>Generic:</strong> {GenericName}</p>
        <p><strong>Price:</strong> {typeof UnitPrice === "number" ? `${UnitPrice.toFixed(2)}` : "N/A"}</p>
        <p><strong>Expiry:</strong> {formattedExpiry}</p>
        <p><strong>Available:</strong> {Quantity} units</p>
        <button onClick={() => onAddToCart(medicine)}>Add to Cart</button>
      </div>
    </div>
  );
};

export default MedicineCard;
