import React, { useEffect, useState } from "react";
import axios from "axios";
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import { Trash, Eye, Edit } from 'lucide-react'; // Import Lucide React icons
import "./AProductlist.css"; // Updated styles

const AProductlist = () => {
  const [products, setProducts] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [expirySearch, setExpirySearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false); // State to manage popup visibility
  const [newProduct, setNewProduct] = useState({
    Name: "",
    BatchNumber: "",
    ExpiryDate: "",
    Quantity: 0,
    UnitPrice: 0,
  });

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/products")
      .then((response) => {
        console.log("Products received:", response.data);
        setProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  }, []);

  // Filter products based on search inputs
  const filteredData = products.filter((product) => {
    return (
      (product.Name.toLowerCase().includes(nameSearch.toLowerCase()) || !nameSearch) &&
      (product.ExpiryDate.includes(expirySearch) || !expirySearch) &&
      (product.BatchNumber.toLowerCase().includes(batchSearch.toLowerCase()) || !batchSearch)
    );
  });

  // Handle new product form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:5000/api/admin/products", newProduct)
      .then((response) => {
        console.log("New product added:", response.data);
        setProducts([...products, response.data]); // Add the new product to the state
        setShowPopup(false); // Close the popup
        setNewProduct({ Name: "", BatchNumber: "", ExpiryDate: "", Quantity: 0, UnitPrice: 0 }); // Clear form
      })
      .catch((error) => {
        console.error("Error adding product:", error);
      });
  };

  return (
    <div className="ap-dashboard-container">
      <ASidebar />
      <div className="ap-main-content">
        <ANavbar />
        <div className="ap-product-list-container">
          <h2 className="ap-heading">Product List</h2>

          {/* Search and Generate Button Section */}
          <div className="ap-search-section">
            <input
              type="text"
              className="ap-search-input"
              placeholder="Search by Name"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
            <input
              type="text"
              className="ap-search-input"
              placeholder="Search by Expiry Date"
              value={expirySearch}
              onChange={(e) => setExpirySearch(e.target.value)}
            />
            <input
              type="text"
              className="ap-search-input"
              placeholder="Search by Batch Number"
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
            />
            <button className="ap-generate-button">Generate Report</button>
            {/* Add New Medicine Button */}
            <button className="ap-add-medicine-button" onClick={() => setShowPopup(true)}>Add New Medicine</button>
          </div>

          {/* Table */}
          <div className="ap-table-container">
            {loading ? (
              <p className="ap-loading">Loading products...</p>
            ) : filteredData.length === 0 ? (
              <p className="ap-no-products">No products available</p>
            ) : (
              <table className="ap-product-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Batch Number</th>
                    <th>Expiry Date</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((product) => (
                    <tr key={product.ProductID}>
                      <td>{product.ProductID}</td>
                      <td>{product.Name}</td>
                      <td>{product.BatchNumber}</td>
                      <td>{new Date(product.ExpiryDate).toLocaleDateString("en-GB")}</td>
                      <td>{product.Quantity}</td>
                      <td>${product.UnitPrice.toFixed(2)}</td>
                      <td>${product.TotalPrice.toFixed(2)}</td>
                      <td>
                        <button className="ap-action-button">
                          <Eye size={18} /> {/* View Icon */}
                        </button>
                        <button className="ap-action-button">
                          <Edit size={18} /> {/* Edit Icon */}
                        </button>
                        <button className="ap-action-button">
                          <Trash size={18} /> {/* Delete Icon */}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Popup Form */}
      {showPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>Add New Product</h3>
            <form onSubmit={handleSubmit}>
              <div className="ap-form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="Name"
                  value={newProduct.Name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label>Batch Number</label>
                <input
                  type="text"
                  name="BatchNumber"
                  value={newProduct.BatchNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="ExpiryDate"
                  value={newProduct.ExpiryDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="Quantity"
                  value={newProduct.Quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-group">
                <label>Unit Price</label>
                <input
                  type="number"
                  name="UnitPrice"
                  value={newProduct.UnitPrice}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="ap-form-actions">
                <button type="submit" className="ap-submit-button">Submit</button>
                <button type="button" className="ap-cancel-button" onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AProductlist;
