import React, { useEffect, useState } from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import { ShoppingCart } from "lucide-react";
import "./MSupplier.css"; 

const MSupplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    CompanyName: "",
    PhoneNumber: "",
    Address: "",
    SupplierEmail: ""
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/api/suppliers')
      .then(response => response.json())
      .then(data => setSuppliers(data))
      .catch(error => console.error("Error fetching suppliers:", error));
  }, []);

  const handleIconClick = (supplierId) => {
    fetch(`http://localhost:5000/api/admin/products/get-products-by-supplier?SupplierID=${supplierId}`)
      .then(response => response.json())
      .then(data => {
        setProducts(data);
        setShowPopup(true);
      })
      .catch(error => console.error("Error fetching products:", error));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate required fields
    if (!formData.CompanyName || !formData.PhoneNumber || !formData.Address) {
      setFormError("Please fill in all required fields (Company Name, Phone Number, Address)");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add supplier');
      }

      const newSupplier = await response.json();
      setSuppliers(prev => [...prev, { 
        SupplierID: newSupplier.SupplierID, 
        ...formData 
      }]);
      setFormData({
        CompanyName: "",
        PhoneNumber: "",
        Address: "",
        SupplierEmail: ""
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
      setFormError("Failed to add supplier. Please try again.");
    }
  };

  return (
    <div className="supplier-container">
      <MNavbar />
      <div className="supplier-content">
        <MSidebar />
        <div className="supplier-main">
          <h1>Supplier Management</h1>
          
          {/* Add Supplier Button */}
          <button 
            className="add-supplier-button"
            onClick={() => setShowAddForm(true)}
          >
            Add New Supplier
          </button>

          {/* Supplier Table */}
          <table className="supplier-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Company Name</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.SupplierID}>
                  <td>{supplier.SupplierID}</td>
                  <td>{supplier.CompanyName}</td>
                  <td>{supplier.PhoneNumber}</td>
                  <td>{supplier.Address}</td>
                  <td>
                    <ShoppingCart 
                      size={24} 
                      className="supplier-icon" 
                      onClick={() => handleIconClick(supplier.SupplierID)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Supplier Form Modal */}
          {showAddForm && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h2>Add New Supplier</h2>
                {formError && <p className="error-message">{formError}</p>}
                <form onSubmit={handleAddSupplier}>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      name="CompanyName"
                      value={formData.CompanyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      name="PhoneNumber"
                      value={formData.PhoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address *</label>
                    <textarea
                      name="Address"
                      value={formData.Address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="SupplierEmail"
                      value={formData.SupplierEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-buttons">
                    <button type="submit" className="submit-button">Add Supplier</button>
                    <button 
                      type="button" 
                      className="close-button" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Popup Modal for Products */}
          {showPopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h2>Products from Supplier</h2>
                <table className="popup-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.ProductID}>
                        <td>{product.Name}</td>
                        <td>Rs {parseFloat(product.UnitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="close-button" onClick={() => setShowPopup(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MSupplier;