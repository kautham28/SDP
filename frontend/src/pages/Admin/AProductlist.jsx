import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf"; // Import jsPDF
import "jspdf-autotable"; // Import jsPDF autoTable plugin
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import { Trash, Eye, Edit } from "lucide-react";
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

  const generateReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Product Report", 14, 22);

    const headers = ["Product ID", "Name", "Batch Number", "Expiry Date", "Quantity", "Unit Price", "Total Price"];

    const data = filteredProducts.map((product) => [
      product.ProductID,
      product.Name,
      product.BatchNumber,
      new Date(product.ExpiryDate).toLocaleDateString("en-GB"),
      product.Quantity,
      product.UnitPrice.toFixed(2),
      (product.UnitPrice * product.Quantity).toFixed(2), // Calculate total price dynamically
    ]);

    doc.autoTable({
      head: [headers],
      body: data,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
      margin: { top: 30, left: 14, right: 14 },
    });

    doc.save("product_report.pdf");
  };

  const filteredProducts = products.filter((product) => {
    return (
      product.Name.toLowerCase().includes(nameSearch.toLowerCase()) &&
      product.ExpiryDate.includes(expirySearch) &&
      product.BatchNumber.toLowerCase().includes(batchSearch.toLowerCase())
    );
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const totalPrice = parseFloat(newProduct.UnitPrice) * parseInt(newProduct.Quantity);

    const productData = {
      ...newProduct,
      TotalPrice: totalPrice,
    };

    if (editMode && selectedProduct) {
      // Update product logic
      axios
        .put(`http://localhost:5000/api/admin/products/${selectedProduct.ProductID}`, productData)
        .then(() => {
          setShowPopup(false);
          fetchProducts(); // Re-fetch products after update
          setShowSuccessPopup(true);
        })
        .catch((error) => {
          console.error("Error updating product:", error);
        });
    } else {
      // Add new product logic
      axios
        .post("http://localhost:5000/api/admin/products", productData)
        .then(() => {
          setShowPopup(false);
          fetchProducts(); // Re-fetch products after adding new one
          setShowSuccessPopup(true);
        })
        .catch((error) => {
          console.error("Error adding new product:", error);
        });
    }
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setSelectedProduct(product);
    setNewProduct({
      Name: product.Name,
      BatchNumber: product.BatchNumber,
      ExpiryDate: product.ExpiryDate,
      Quantity: product.Quantity,
      UnitPrice: product.UnitPrice,
    });
    setShowPopup(true);
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewPopup(true);
  };

  const handleDelete = (productId) => {
    axios
      .delete(`http://localhost:5000/api/admin/products/${productId}`)
      .then(() => {
        fetchProducts(); // Re-fetch products after delete
        setShowSuccessPopup(true);
      })
      .catch((error) => {
        console.error("Error deleting product:", error);
      });
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
  };

  return (
    <div className="ap-dashboard-container">
      <ASidebar />
      <div className="ap-main-content">
        <ANavbar />
        <div className="ap-product-list-container">
          <h2 className="ap-heading">Product List</h2>

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
            <button className="ap-generate-button" onClick={generateReport}>
              Generate Report
            </button>
            <button className="ap-add-medicine-button" onClick={() => setShowPopup(true)}>
              Add New Medicine
            </button>
          </div>

          <div className="ap-table-container">
            {loading ? (
              <p className="ap-loading">Loading products...</p>
            ) : filteredProducts.length === 0 ? (
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
                  {filteredProducts.map((product) => (
                    <tr key={product.ProductID}>
                      <td>{product.ProductID}</td>
                      <td>{product.Name}</td>
                      <td>{product.BatchNumber}</td>
                      <td>{new Date(product.ExpiryDate).toLocaleDateString("en-GB")}</td>
                      <td>{product.Quantity}</td>
                      <td>{product.UnitPrice.toFixed(2)}</td>
                      <td>{(product.UnitPrice * product.Quantity).toFixed(2)}</td>
                      <td>
                        <button className="ap-action-button ap-action-button-view" onClick={() => handleView(product)}>
                         <Eye size={18} />
                         </button>
                         <button className="ap-action-button ap-action-button-edit" onClick={() => handleEdit(product)}>
                          <Edit size={18} />
                         </button>
                         <button className="ap-action-button ap-action-button-delete" onClick={() => handleDelete(product.ProductID)}>
                        <Trash size={18} />
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

      {/* Popup Modals */}
      {showPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>{editMode ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="Name"
                value={newProduct.Name}
                onChange={handleInputChange}
                required
                placeholder="Product Name"
              />
              <input
                type="text"
                name="BatchNumber"
                value={newProduct.BatchNumber}
                onChange={handleInputChange}
                required
                placeholder="Batch Number"
              />
              <input
                type="date"
                name="ExpiryDate"
                value={newProduct.ExpiryDate}
                onChange={handleInputChange}
                required
              />
              <input
                type="number"
                name="Quantity"
                value={newProduct.Quantity}
                onChange={handleInputChange}
                required
                placeholder="Quantity"
              />
              <input
                type="number"
                name="UnitPrice"
                value={newProduct.UnitPrice}
                onChange={handleInputChange}
                required
                placeholder="Unit Price"
              />
              <button type="submit">{editMode ? "Update" : "Submit"}</button>
              <button type="button" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>Product {editMode ? "Updated" : "Added"} Successfully</h3>
            <button onClick={handleSuccessPopupClose}>OK</button>
          </div>
        </div>
      )}

      {/* View Product Popup */}
      {showViewPopup && selectedProduct && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>Product Details</h3>
            <p>
              <strong>Name:</strong> {selectedProduct.Name}
            </p>
            <p>
              <strong>Batch Number:</strong> {selectedProduct.BatchNumber}
            </p>
            <p>
              <strong>Expiry Date:</strong> {new Date(selectedProduct.ExpiryDate).toLocaleDateString("en-GB")}
            </p>
            <p>
              <strong>Quantity:</strong> {selectedProduct.Quantity}
            </p>
            <p>
              <strong>Unit Price:</strong> {selectedProduct.UnitPrice.toFixed(2)}
            </p>
            <p>
              <strong>Total Price:</strong> {(selectedProduct.UnitPrice * selectedProduct.Quantity).toFixed(2)}
            </p>
            <button onClick={() => setShowViewPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AProductlist;