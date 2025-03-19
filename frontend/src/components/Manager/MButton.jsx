import React from "react";
import "./MButton.css"; // Importing CSS

const MButton = ({ label, onClick, variant = "primary", disabled = false }) => {
  return (
    <button 
      className={`m-button ${variant}`} 
      onClick={onClick} 
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default MButton;
