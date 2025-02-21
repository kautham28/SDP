import React, { useEffect, useState } from "react";
import axios from "axios";
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import { Trash, Eye, Edit } from 'lucide-react';
import "./AProductlist.css";

const AProductlist = () => {
  const [products, setProducts] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [expirySearch, setExpirySearch] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    Name: "",
    BatchNumber: "",
    ExpiryDate: "",
    Quantity: "",
    UnitPrice: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios
      .get("http://localhost:5000/api/admin/products")
      .then((response) => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleSearchSelect = (product) => {
    setNewProduct({
      Name: product.Name,
      BatchNumber: product.BatchNumber,
      ExpiryDate: product.ExpiryDate,
      Quantity: product.Quantity,
      UnitPrice: product.UnitPrice,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editMode
      ? `http://localhost:5000/api/admin/products/${selectedProduct.ProductID}`
      : "http://localhost:5000/api/admin/products";
    const method = editMode ? "put" : "post";

    axios[method](url, newProduct)
      .then(() => {
        setShowPopup(false);
        setShowSuccessPopup(true);
        setNewProduct({ Name: "", BatchNumber: "", ExpiryDate: "", Quantity: "", UnitPrice: "" });
        setEditMode(false);
        setSelectedProduct(null);
        fetchProducts();
      })
      .catch((error) => {
        console.error("Error adding/updating product:", error);
      });
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    fetchProducts();
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewPopup(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setNewProduct(product);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleDelete = (productID) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      axios
        .delete(`http://localhost:5000/api/admin/products/${productID}`)
        .then(() => {
          fetchProducts();
        })
        .catch((error) => {
          console.error("Error deleting product:", error);
        });
    }
  };

  return (
    <div className="ap-dashboard-container">
      <ASidebar />
      <div className="ap-main-content">
        <ANavbar />
        <div className="ap-product-list-container">
          <h2 className="ap-heading">Product List</h2>

          <div className="ap-search-section">
            <input type="text" className="ap-search-input" placeholder="Search by Name" value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} />
            <input type="text" className="ap-search-input" placeholder="Search by Expiry Date" value={expirySearch} onChange={(e) => setExpirySearch(e.target.value)} />
            <input type="text" className="ap-search-input" placeholder="Search by Batch Number" value={batchSearch} onChange={(e) => setBatchSearch(e.target.value)} />
            <button className="ap-generate-button">Generate Report</button>
            <button className="ap-add-medicine-button" onClick={() => setShowPopup(true)}>Add New Medicine</button>
          </div>

          <div className="ap-table-container">
            {loading ? (
              <p className="ap-loading">Loading products...</p>
            ) : products.length === 0 ? (
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
                  {products.map((product) => (
                    <tr key={product.ProductID}>
                      <td>{product.ProductID}</td>
                      <td>{product.Name}</td>
                      <td>{product.BatchNumber}</td>
                      <td>{new Date(product.ExpiryDate).toLocaleDateString("en-GB")}</td>
                      <td>{product.Quantity}</td>
                      <td>${product.UnitPrice.toFixed(2)}</td>
                      <td>${product.TotalPrice.toFixed(2)}</td>
                      <td>
                        <button className="ap-action-button" onClick={() => handleView(product)}><Eye size={18} /></button>
                        <button className="ap-action-button" onClick={() => handleEdit(product)}><Edit size={18} /></button>
                        <button className="ap-action-button" onClick={() => handleDelete(product.ProductID)}><Trash size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>{editMode ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" name="Name" value={newProduct.Name} onChange={handleInputChange} required placeholder="Product Name" />
              <input type="text" name="BatchNumber" value={newProduct.BatchNumber} onChange={handleInputChange} required placeholder="Batch Number" />
              <input type="date" name="ExpiryDate" value={newProduct.ExpiryDate} onChange={handleInputChange} required />
              <input type="number" name="Quantity" value={newProduct.Quantity} onChange={handleInputChange} required placeholder="Quantity" />
              <input type="number" name="UnitPrice" value={newProduct.UnitPrice} onChange={handleInputChange} required placeholder="Unit Price" />
              <button type="submit">{editMode ? "Update" : "Submit"}</button>
              <button type="button" onClick={() => setShowPopup(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>Product {editMode ? "Updated" : "Added"} Successfully</h3>
            <button onClick={handleSuccessPopupClose}>OK</button>
          </div>
        </div>
      )}

      {showViewPopup && selectedProduct && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>Product Details</h3>
            <p><strong>Name:</strong> {selectedProduct.Name}</p>
            <p><strong>Batch Number:</strong> {selectedProduct.BatchNumber}</p>
            <p><strong>Expiry Date:</strong> {new Date(selectedProduct.ExpiryDate).toLocaleDateString("en-GB")}</p>
            <p><strong>Quantity:</strong> {selectedProduct.Quantity}</p>
            <p><strong>Unit Price:</strong> ${selectedProduct.UnitPrice.toFixed(2)}</p>
            <p><strong>Total Price:</strong> ${selectedProduct.TotalPrice.toFixed(2)}</p>
            <button onClick={() => setShowViewPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AProductlist;