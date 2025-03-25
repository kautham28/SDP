import React, { useState } from "react";
import "./MSearchBox.css"; // Import the CSS file

const SearchBox = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <ul className="search-results">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <li key={index} className="search-item">
              {item}
            </li>
          ))
        ) : (
          <li className="search-no-results">No results found</li>
        )}
      </ul>
    </div>
  );
};

export default SearchBox;
