import React, { useEffect, useState } from "react";
import axios from "axios";
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import { Trash, Eye, Edit } from "lucide-react";
import "./AProductlist.css";
import Swal from "sweetalert2";

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
    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    
    // Format date for display
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-GB");
    };
    
    // Build the HTML table with product data
    let tableRows = '';
    filteredProducts.forEach(product => {
      tableRows += `
        <tr>
          <td>${product.ProductID}</td>
          <td>${product.Name}</td>
          <td>${product.BatchNumber}</td>
          <td>${formatDate(product.ExpiryDate)}</td>
          <td>${product.Quantity}</td>
          <td>${product.UnitPrice.toFixed(2)}</td>
          <td>${(product.UnitPrice * product.Quantity).toFixed(2)}</td>
        </tr>
      `;
    });
    
    // Write the complete HTML content to the new window
    printWindow.document.write(`
      <html>
      <head>
        <title>Product Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #003f4f; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { margin-bottom: 20px; }
          .footer { margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p><strong>RAM Medical</strong></p>
          <h2>Product Report</h2>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Name</th>
              <th>Batch Number</th>
              <th>Expiry Date</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>......................</strong></p>
          <p><strong>Checked by</strong></p>
        </div>
      </body>
      </html>
    `);
    
    // Close the document stream and trigger print
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

    if (!newProduct.Name || !newProduct.BatchNumber || !newProduct.ExpiryDate || 
        !newProduct.Quantity || !newProduct.UnitPrice) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields (Name, Batch Number, Expiry Date, Quantity, Unit Price)',
        icon: 'error'
      });
      return;
    }

    const formData = new FormData();
    formData.append("Name", newProduct.Name);
    formData.append("BatchNumber", newProduct.BatchNumber);
    formData.append("ExpiryDate", newProduct.ExpiryDate);
    formData.append("Quantity", newProduct.Quantity.toString());
    formData.append("UnitPrice", newProduct.UnitPrice.toString());
    formData.append("SupplierName", newProduct.SupplierName || "");
    formData.append("DeliveryDate", newProduct.DeliveryDate || "");
    formData.append("SupplierEmail", newProduct.SupplierEmail || "");
    formData.append("MinStock", newProduct.MinStock.toString());
    formData.append("SupplierID", newProduct.SupplierID || "");
    formData.append("GenericName", newProduct.GenericName || "");
    if (newProduct.Image) {
      formData.append("Image", newProduct.Image);
    }

    const apiCall = editMode && selectedProduct
      ? axios.put(`http://localhost:5000/api/admin/products/${selectedProduct.ProductID}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      : axios.post("http://localhost:5000/api/admin/products", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

    apiCall
      .then(response => {
        if (response.data && response.data.success) {
          Swal.fire({
            title: 'Success!',
            text: `Product ${editMode ? 'updated' : 'added'} successfully`,
            icon: 'success'
          });
          setShowPopup(false);
          fetchProducts();
          setNewProduct({
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
          setEditMode(false);
          setSelectedProduct(null);
        } else {
          throw new Error(response.data?.message || 'Operation failed');
        }
      })
      .catch(error => {
        console.error("API Error:", error);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to process request';
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error'
        });
      });
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
      Image: null,
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
            fetchProducts();
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
              <div>
                <input
                  type="text"
                  name="Name"
                  value={newProduct.Name}
                  onChange={handleInputChange}
                  required
                  placeholder="Product Name*"
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
                  placeholder="Batch Number*"
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
                  placeholder="Quantity*"
                  min="1"
                />
                <input
                  type="number"
                  name="UnitPrice"
                  value={newProduct.UnitPrice}
                  onChange={handleInputChange}
                  required
                  placeholder="Unit Price*"
                  min="0"
                  step="0.01"
                />
              </div>

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
                  min="0"
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
                {newProduct.Image && (
                  <div className="image-preview">
                    <p>Selected: {newProduct.Image.name}</p>
                  </div>
                )}
              </div>

              <div className="ap-popup-buttons">
                <button type="submit" className="submit-btn">
                  {editMode ? "Update" : "Submit"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPopup(false);
                    setNewProduct({
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
                    setEditMode(false);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-container">
            <h3>Operation Successful</h3>
            <button onClick={handleSuccessPopupClose}>OK</button>
          </div>
        </div>
      )}

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