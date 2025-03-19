import React, { useEffect, useState } from "react";
import axios from "axios";
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import "./MInventory.css"; // Ensure this file includes styles for scrollable tables

const MInventory = () => {
  const [products, setProducts] = useState([]); // State to store fetched products

  // Fetch products from the API
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/products");
      console.log("Fetched Products:", response.data); // Debugging
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products when the component mounts
  }, []);

  return (
    <div className="inventory-container">
      <MNavbar />
      <div className="inventory-content">
        <MSidebar />
        <div className="inventory-main">
          <h1>Inventory</h1>
          <p>Manage stock levels and inventory details.</p>

          {/* Scrollable Table Container */}
          <div className="table-container">
            <table className="inventory-table">
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
                {products.length > 0 ? (
                  products.map((product) => {
                    const stockQuantity = Number(product.StockQuantity) || 0; // Ensure it's a number
                    const unitPrice = Number(product.Price) || 0; // Ensure it's a number
                    const totalPrice = stockQuantity * unitPrice; // Calculate total price

                    return (
                      <tr key={product.ProductID || product.Name}> {/* Ensure a unique key */}
                        <td>{product.ProductID || "N/A"}</td>
                        <td>{product.Name || "N/A"}</td>
                        <td>{product.BatchNumber || "N/A"}</td>
                        <td>{product.ExpiryDate ? new Date(product.ExpiryDate).toLocaleDateString() : "N/A"}</td>
                        <td>{product.Quantity}</td>
                        <td>{product.UnitPrice.toFixed(2)}</td>
                        <td>{product.TotalPrice.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">No products available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MInventory;
