import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf"; // Import jsPDF
import "jspdf-autotable"; // Import jsPDF autoTable plugin
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import { Trash, Eye, Edit } from "lucide-react";
import "./AProductlist.css";
import Swal from "sweetalert2"; // Import SweetAlert2


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
    SupplierName: "",
    DeliveryDate: "",
    SupplierEmail: "",
    MinStock: 0,
    SupplierID: "",
    GenericName: "",
    Image: null,
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

  const handleImageChange = (e) => {
    setNewProduct({ ...newProduct, Image: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("Name", newProduct.Name);
    formData.append("BatchNumber", newProduct.BatchNumber);
    formData.append("ExpiryDate", newProduct.ExpiryDate);
    formData.append("Quantity", newProduct.Quantity);
    formData.append("UnitPrice", newProduct.UnitPrice);
    formData.append("SupplierName", newProduct.SupplierName);
    formData.append("DeliveryDate", newProduct.DeliveryDate);
    formData.append("SupplierEmail", newProduct.SupplierEmail);
    formData.append("MinStock", newProduct.MinStock);
    formData.append("SupplierID", newProduct.SupplierID);
    formData.append("GenericName", newProduct.GenericName);
    if (newProduct.Image) {
      formData.append("Image", newProduct.Image);
    }

    if (editMode && selectedProduct) {
      // Update product logic
      axios
        .put(`http://localhost:5000/api/admin/products/${selectedProduct.ProductID}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
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
        .post("http://localhost:5000/api/admin/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
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
      SupplierName: product.SupplierName,
      DeliveryDate: product.DeliveryDate,
      SupplierEmail: product.SupplierEmail,
      MinStock: product.MinStock,
      SupplierID: product.SupplierID,
      GenericName: product.GenericName,
    });
    setShowPopup(true);
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewPopup(true);
  };

  const handleDelete = (productId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`http://localhost:5000/api/admin/products/${productId}`)
          .then(() => {
            fetchProducts(); // Re-fetch products after delete
            setShowSuccessPopup(true);
            Swal.fire({
              title: "Deleted!",
              text: "Your product has been deleted.",
              icon: "success",
            });
          })
          .catch((error) => {
            console.error("Error deleting product:", error);
          });
      }
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

      {showPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>{editMode ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleSubmit} className="ap-popup-form">
              {/* Left Column */}
              <div>
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
                  name="GenericName"
                  value={newProduct.GenericName}
                  onChange={handleInputChange}
                  placeholder="Generic Name"
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
              </div>

              {/* Right Column */}
              <div>
                <input
                  type="text"
                  name="SupplierName"
                  value={newProduct.SupplierName}
                  onChange={handleInputChange}
                  placeholder="Supplier Name"
                />
                <input
                  type="date"
                  name="DeliveryDate"
                  value={newProduct.DeliveryDate}
                  onChange={handleInputChange}
                  placeholder="Delivery Date"
                />
                <input
                  type="email"
                  name="SupplierEmail"
                  value={newProduct.SupplierEmail}
                  onChange={handleInputChange}
                  placeholder="Supplier Email"
                />
                <input
                  type="number"
                  name="MinStock"
                  value={newProduct.MinStock}
                  onChange={handleInputChange}
                  placeholder="Minimum Stock"
                />
                <input
                  type="text"
                  name="SupplierID"
                  value={newProduct.SupplierID}
                  onChange={handleInputChange}
                  placeholder="Supplier ID"
                />
                <input
                  type="file"
                  name="Image"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </div>

              {/* Buttons */}
              <div className="ap-popup-buttons">
                <button type="submit">{editMode ? "Update" : "Submit"}</button>
                <button type="button" onClick={() => setShowPopup(false)}>
                  Cancel
                </button>
              </div>
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
            <table className="ap-product-details-table">
              <thead>
                <tr>
                  <th>Detail</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Name</td>
                  <td>{selectedProduct.Name}</td>
                </tr>
                <tr>
                  <td>Batch Number</td>
                  <td>{selectedProduct.BatchNumber}</td>
                </tr>
                <tr>
                  <td>Expiry Date</td>
                  <td>{new Date(selectedProduct.ExpiryDate).toLocaleDateString("en-GB")}</td>
                </tr>
                <tr>
                  <td>Quantity</td>
                  <td>{selectedProduct.Quantity}</td>
                </tr>
                <tr>
                  <td>Unit Price</td>
                  <td>{selectedProduct.UnitPrice.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Price</td>
                  <td>{(selectedProduct.UnitPrice * selectedProduct.Quantity).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Supplier Name</td>
                  <td>{selectedProduct.SupplierName}</td>
                </tr>
                <tr>
                  <td>Delivery Date</td>
                  <td>{selectedProduct.DeliveryDate ? new Date(selectedProduct.DeliveryDate).toLocaleDateString("en-GB") : ""}</td>
                </tr>
                <tr>
                  <td>Supplier Email</td>
                  <td>{selectedProduct.SupplierEmail}</td>
                </tr>
                <tr>
                  <td>Minimum Stock</td>
                  <td>{selectedProduct.MinStock}</td>
                </tr>
                <tr>
                  <td>Supplier ID</td>
                  <td>{selectedProduct.SupplierID}</td>
                </tr>
                <tr>
                  <td>Generic Name</td>
                  <td>{selectedProduct.GenericName}</td>
                </tr>
                <tr>
                  <td>Image</td>
                  <td>
                    {selectedProduct.ImagePath && (
                      <img src={selectedProduct.ImagePath} alt={selectedProduct.Name} style={{ width: '100px', height: '100px' }} />
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <button onClick={() => setShowViewPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AProductlist;