import React, { useEffect, useState } from "react";
import axios from "axios";
import ASidebar from "../../components/Admin/ASidebar";
import ANavbar from "../../components/Admin/ANavbar";
import { Trash, Eye, Edit } from "lucide-react";
import "./AProductlist.css";
import Swal from "sweetalert2";

const AProductlist = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
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

  const fetchSuppliers = () => {
    axios
      .get("http://localhost:5000/api/suppliers")
      .then((response) => {
        setSuppliers(response.data);
        console.log("Suppliers fetched:", response.data); // Debug
      })
      .catch((error) => {
        console.error("Error fetching suppliers:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to fetch suppliers",
          icon: "error",
        });
      });
  };

  const validateForm = () => {
    const errors = [];

    if (!newProduct.Name.match(/^[a-zA-Z0-9 ]+$/)) {
      errors.push("Product Name should only contain letters, numbers, and spaces");
    }

    if (!newProduct.BatchNumber.match(/^[a-zA-Z0-9 ]+$/)) {
      errors.push("Batch Number should be alphanumeric and can include spaces");
    }

    if (newProduct.ExpiryDate) {
      const expiry = new Date(newProduct.ExpiryDate);
      const today = new Date();
      if (expiry <= today) {
        errors.push("Expiry Date must be in the future");
      }
    }

    return errors;
  };

  const printReport = () => {
    const printWindow = window.open("", "", "width=800,height=600");

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("en-GB");
    };

    let tableRows = "";
    filteredProducts.forEach((product) => {
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

    printWindow.document.write(`
      <html>
        <head>
          <title>Product Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>RAM Medical</h1>
          <h2>Product Report</h2>
          <table>
            <tr>
              <th>Product ID</th>
              <th>Name</th>
              <th>Batch Number</th>
              <th>Expiry Date</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
            ${tableRows}
          </table>
          <div class="footer">
            <p>......................</p>
            <p>Checked by</p>
          </div>
        </body>
      </html>
    `);

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

    if (name === "Name") {
      if (value && !value.match(/^[a-zA-Z0-9 ]*$/)) {
        setNameError("Product Name should only contain letters, numbers, and spaces");
      } else {
        setNameError("");
      }
    }

    if (name === "SupplierName") {
      const selectedSupplier = suppliers.find((supplier) => supplier.CompanyName === value);
      setNewProduct((prevProduct) => ({
        ...prevProduct,
        SupplierName: value,
        SupplierEmail: selectedSupplier ? selectedSupplier.SupplierEmail || "" : "",
        SupplierID: selectedSupplier ? selectedSupplier.SupplierID || "" : "",
      }));
    } else {
      if (name === "UnitPrice") {
        let formattedValue = value.replace(/[^0-9.]/g, "");
        const decimalCount = formattedValue.split(".").length - 1;
        if (decimalCount > 1) {
          formattedValue = formattedValue.slice(0, formattedValue.lastIndexOf("."));
        }
        if (formattedValue.includes(".")) {
          const [integer, decimal] = formattedValue.split(".");
          formattedValue = `${integer}.${decimal.slice(0, 2)}`;
        }

        setNewProduct((prevProduct) => ({
          ...prevProduct,
          [name]: formattedValue,
        }));
      } else {
        setNewProduct((prevProduct) => ({
          ...prevProduct,
          [name]: value,
        }));
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: "Error",
          text: "Image size should not exceed 5MB",
          icon: "error",
        });
        return;
      }
      if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
        Swal.fire({
          title: "Error",
          text: "Only JPEG, PNG, or GIF images are allowed",
          icon: "error",
        });
        return;
      }
      setNewProduct({ ...newProduct, Image: file });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !newProduct.Name ||
      !newProduct.BatchNumber ||
      !newProduct.ExpiryDate ||
      !newProduct.Quantity ||
      !newProduct.UnitPrice
    ) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill all required fields (Name, Batch Number, Expiry Date, Quantity, Unit Price)",
        icon: "error",
      });
      return;
    }

    if (nameError) {
      Swal.fire({
        title: "Validation Error",
        text: nameError,
        icon: "error",
      });
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Swal.fire({
        title: "Validation Error",
        html: validationErrors.join("<br>"),
        icon: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("Name", newProduct.Name);
    formData.append("BatchNumber", newProduct.BatchNumber);
    formData.append("ExpiryDate", newProduct.ExpiryDate);
    formData.append("Quantity", newProduct.Quantity.toString());
    formData.append("UnitPrice", parseFloat(newProduct.UnitPrice).toFixed(2));
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
          headers: { "Content-Type": "multipart/form-data" },
        })
      : axios.post("http://localhost:5000/api/admin/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

    apiCall
      .then((response) => {
        if (response.data && response.data.success) {
          Swal.fire({
            title: "Success!",
            text: `Product ${editMode ? "updated" : "added"} successfully`,
            icon: "success",
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
          setNameError("");
        } else {
          throw new Error(response.data?.message || "Operation failed");
        }
      })
      .catch((error) => {
        console.error("API Error:", error);
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to process request";
        Swal.fire({
          title: "Error!",
          text: errorMessage,
          icon: "error",
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
      UnitPrice: product.UnitPrice.toFixed(2),
      SupplierName: product.SupplierName,
      DeliveryDate: product.DeliveryDate,
      SupplierEmail: product.SupplierEmail,
      MinStock: product.MinStock,
      SupplierID: product.SupplierID,
      GenericName: product.GenericName,
      Image: null,
    });
    setNameError("");
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
          <h1 className="ap-heading">Product List</h1>
          <div className="ap-search-section">
            <input
              type="text"
              placeholder="Search by Name"
              className="ap-search-input"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search by Expiry Date"
              className="ap-search-input"
              value={expirySearch}
              onChange={(e) => setExpirySearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search by Batch Number"
              className="ap-search-input"
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
            />
            <button onClick={printReport} className="ap-generate-button">
              Generate Report
            </button>
            <button
              onClick={() => setShowPopup(true)}
              className="ap-add-medicine-button"
            >
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
                      <td>
                        {new Date(product.ExpiryDate).toLocaleDateString("en-GB")}
                      </td>
                      <td>{product.Quantity}</td>
                      <td>{product.UnitPrice.toFixed(2)}</td>
                      <td>
                        {(product.UnitPrice * product.Quantity).toFixed(2)}
                      </td>
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
        {showPopup && (
          <div className="ap-popup-overlay">
            <div className="ap-popup-container">
              <h2 className="ap-popup-header">{editMode ? "Edit Product" : "Add New Product"}</h2>
              <form onSubmit={handleSubmit} className="ap-popup-form">
                <div className="input-container">
                  <label className="block mb-1">Product Name*</label>
                  <input
                    type="text"
                    name="Name"
                    value={newProduct.Name}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                  {nameError && <p className="error-message">{nameError}</p>}
                </div>
                <div className="input-container">
                  <label className="block mb-1">Batch Number*</label>
                  <input
                    type="text"
                    name="BatchNumber"
                    value={newProduct.BatchNumber}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Expiry Date*</label>
                  <input
                    type="date"
                    name="ExpiryDate"
                    value={newProduct.ExpiryDate}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Quantity*</label>
                  <input
                    type="number"
                    name="Quantity"
                    value={newProduct.Quantity}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Unit Price*</label>
                  <input
                    type="text"
                    name="UnitPrice"
                    value={newProduct.UnitPrice}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    required
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Supplier Name</label>
                  <select
                    name="SupplierName"
                    value={newProduct.SupplierName}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.SupplierID} value={supplier.CompanyName}>
                        {supplier.CompanyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-container">
                  <label className="block mb-1">Supplier Email</label>
                  <input
                    type="email"
                    name="SupplierEmail"
                    value={newProduct.SupplierEmail}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    readOnly
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Supplier ID</label>
                  <input
                    type="text"
                    name="SupplierID"
                    value={newProduct.SupplierID}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                    readOnly
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Delivery Date</label>
                  <input
                    type="date"
                    name="DeliveryDate"
                    value={newProduct.DeliveryDate}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    name="MinStock"
                    value={newProduct.MinStock}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Generic Name</label>
                  <input
                    type="text"
                    name="GenericName"
                    value={newProduct.GenericName}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="input-container">
                  <label className="block mb-1">Image</label>
                  <input
                    type="file"
                    name="Image"
                    onChange={handleImageChange}
                    className="border p-2 rounded w-full"
                    accept="image/jpeg,image/png,image/gif"
                  />
                  {newProduct.Image && (
                    <p className="image-preview">Selected: {newProduct.Image.name}</p>
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
                      setNameError("");
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
              <h2 className="ap-popup-header">Operation Successful</h2>
              <div className="ap-popup-buttons">
                <button
                  onClick={handleSuccessPopupClose}
                  className="submit-btn"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
        {showViewPopup && selectedProduct && (
          <div className="ap-popup-overlay">
            <div className="ap-popup-container">
              <h2 className="ap-popup-header">Product Details</h2>
              <div className="ap-product-details-table-container">
                <table className="ap-product-details-table">
                  <tbody>
                    <tr>
                      <td className="font-bold">Name</td>
                      <td>{selectedProduct.Name}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Batch Number</td>
                      <td>{selectedProduct.BatchNumber}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Expiry Date</td>
                      <td>
                        {new Date(selectedProduct.ExpiryDate).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold">Quantity</td>
                      <td>{selectedProduct.Quantity}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Unit Price</td>
                      <td>{selectedProduct.UnitPrice.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Total Price</td>
                      <td>
                        {(selectedProduct.UnitPrice * selectedProduct.Quantity).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold">Supplier Name</td>
                      <td>{selectedProduct.SupplierName}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Delivery Date</td>
                      <td>
                        {selectedProduct.DeliveryDate
                          ? new Date(selectedProduct.DeliveryDate).toLocaleDateString("en-GB")
                          : ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-bold">Supplier Email</td>
                      <td>{selectedProduct.SupplierEmail}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Minimum Stock</td>
                      <td>{selectedProduct.MinStock}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Supplier ID</td>
                      <td>{selectedProduct.SupplierID}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Generic Name</td>
                      <td>{selectedProduct.GenericName}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Image</td>
                      <td>
                        {selectedProduct.ImagePath && (
                          <img
                            src={`http://localhost:5000/${selectedProduct.ImagePath}`}
                            alt={selectedProduct.Name}
                            className="w-24 h-24 object-cover"
                          />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="ap-popup-buttons">
                <button
                  onClick={() => setShowViewPopup(false)}
                  className="cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AProductlist;