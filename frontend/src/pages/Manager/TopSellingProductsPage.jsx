import React, { useEffect, useState } from 'react';
import MNavbar from "../../components/Manager/MNavbar";
import MSidebar from "../../components/Manager/MSidebar";
import '../Manager/TopSellingProductsPage.css'; // External CSS
import axios from 'axios';

const TopSellingProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    // Fetch Top Products
    axios.get("http://localhost:5000/api/analytics/top-products")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch top products:", err);
      });

    // Fetch Valuable Customers
    axios.get("http://localhost:5000/api/analytics/valuable-customers")
      .then((res) => {
        setCustomers(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch valuable customers:", err);
      });
  }, []);

  return (
    <>
      <MNavbar />
      <MSidebar />
      <div className="top-products-container">
        <h2 className="top-products-heading">Top 10 Products Sold in the Last 30 Days</h2>
        <div className="top-products-table-container">
          <table className="top-products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Total Quantity Sold</th>
                <th>Total Sales Value (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{product.product_name}</td>
                  <td>{product.total_quantity_sold}</td>
                  <td>{product.total_sales_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="top-products-heading">Most Valuable Customers in the Last 30 Days</h2>
        <div className="top-products-table-container">
          <table className="top-products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pharmacy Name</th>
                <th>Rep Name</th>
                <th>Total Order Value (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{customer.pharmacy_name}</td>
                  <td>{customer.rep_name}</td>
                  <td>{customer.total_order_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TopSellingProductsPage;
