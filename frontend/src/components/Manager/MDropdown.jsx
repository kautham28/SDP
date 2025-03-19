import React from "react";
import "./MDropdown.css"; // Importing CSS

const MDropdown = ({ label, options, selectedValue, onSelect }) => {
  return (
    <div className="m-dropdown">
      {label && <label className="m-dropdown-label">{label}</label>}
      <select 
        className="m-dropdown-select" 
        value={selectedValue} 
        onChange={(e) => onSelect(e.target.value)}
      >
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MDropdown;
