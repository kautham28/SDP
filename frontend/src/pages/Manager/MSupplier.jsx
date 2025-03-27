import React, { useEffect, useState } from "react";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import { ShoppingCart } from "lucide-react"; // Import icon
import "./MSupplier.css"; 

const MSupplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

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

  return (
    <div className="supplier-container">
      <MNavbar />
      <div className="supplier-content">
        <MSidebar />
        <div className="supplier-main">
          <h1>Supplier Management</h1>
          

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
