import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './ProductSalesReport.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const ProductSalesReport = () => {
  const [productData, setProductData] = useState([]);
  const [repData, setRepData] = useState([]);
  const [startDate, setStartDate] = useState('2025-04-01'); // Default start date to match sample data
  const [endDate, setEndDate] = useState('2025-05-07'); // Default end date to current date
  const [productNameFilter, setProductNameFilter] = useState('');
  const [pharmacyNameFilter, setPharmacyNameFilter] = useState('');
  const [repNameFilter, setRepNameFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, productNameFilter, pharmacyNameFilter, repNameFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/reports/product-sales-report', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          productName: productNameFilter || undefined,
          pharmacyName: pharmacyNameFilter || undefined,
          repName: repNameFilter || undefined,
        },
      });

      console.log('API Response:', response.data); // Debug: Log the full response

      // Handle different possible response structures
      if (response.data.success) {
        setProductData(response.data.data?.productSummary || response.data.productSummary || []);
        setRepData(response.data.data?.repProductSummary || response.data.repProductSummary || []);
      } else {
        throw new Error('API returned unsuccessful response: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching data:', err.message, err.response?.data); // Debug: Log error details
      setError('Failed to fetch product sales report data. Please check the server logs or try again later.');
      setProductData([]);
      setRepData([]);
    } finally {
      setLoading(false);
    }
  };

  // Product-wise Summary Metrics
  const totalSalesValue = productData.length > 0
    ? productData.reduce((sum, item) => sum + parseFloat(item.totalSalesValue || 0), 0).toFixed(2)
    : '0.00';
  const totalQuantitySold = productData.length > 0
    ? productData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
    : 0;
  const totalOrderCount = productData.length > 0
    ? productData.reduce((sum, item) => sum + (item.orderCount || 0), 0)
    : 0;
  const avgUnitPrice = productData.length > 0
    ? (productData.reduce((sum, item) => sum + parseFloat(item.avgUnitPrice || 0), 0) / productData.length).toFixed(2)
    : '0.00';

  // Bar Chart: Sales Value and Quantity by Product
  const barData = {
    labels: productData.map(item => item.productName || 'Unknown'),
    datasets: [
      {
        label: 'Total Sales Value',
        data: productData.map(item => parseFloat(item.totalSalesValue || 0)),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
      {
        label: 'Total Quantity Sold',
        data: productData.map(item => item.totalQuantity || 0),
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
        borderWidth: 1,
      },
    ],
  };

  // Pie Chart: Sales Distribution by Pharmacy (for top products)
  const topProducts = productData.slice(0, 5); // Limit to top 5 for visualization
  const pharmacySales = {};
  topProducts.forEach(item => {
    (item.pharmacies || []).forEach(pharmacy => {
      pharmacySales[pharmacy] = (pharmacySales[pharmacy] || 0) + parseFloat(item.totalSalesValue || 0) / (item.pharmacies?.length || 1);
    });
  });
  const pieData = {
    labels: Object.keys(pharmacySales),
    datasets: [
      {
        data: Object.values(pharmacySales),
        backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#E7E9ED'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#E7E9ED'],
      },
    ],
  };

  // Stacked Bar Chart: Rep-wise Product Sales
  const uniqueReps = [...new Set(repData.map(item => item.repName || 'Unknown'))];
  const uniqueProducts = [...new Set(repData.map(item => item.productName || 'Unknown'))];
  const repBarData = {
    labels: uniqueReps,
    datasets: uniqueProducts.map((product, index) => ({
      label: product,
      data: uniqueReps.map(rep => {
        const repProduct = repData.find(item => item.repName === rep && item.productName === product);
        return repProduct ? parseFloat(repProduct.totalSalesValue || 0) : 0;
      }),
      backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0', '#FFCE56', '#E7E9ED'][index % 5],
      borderWidth: 1,
    })),
  };

  // Top Product per Rep
  const topProductsByRep = uniqueReps.map(rep => {
    const repSales = repData.filter(item => item.repName === rep);
    return repSales.reduce(
      (top, item) =>
        parseFloat(item.totalSalesValue || 0) > parseFloat(top.totalSalesValue || 0) ? item : top,
      { productName: 'N/A', totalSalesValue: '0.00' }
    );
  });

  // Unique Product Names, Pharmacies, and Reps for dropdowns
  const uniqueProductNames = [...new Set(productData.map(item => item.productName || 'Unknown'))];
  const uniquePharmacies = [...new Set(productData.flatMap(item => item.pharmacies || []))];
  const uniqueRepNames = [...new Set(repData.map(item => item.repName || 'Unknown'))];

  return (
    <div className="product-sales-container">
      <MNavbar />
      <div className="product-sales-content">
        <MSidebar />
        <div className="product-sales-main">
          <h1 className="product-sales-heading">Product-wise Sales Report</h1>
          <p className="product-sales-description">
            Analyze sales performance based on individual products and sales trends.
          </p>

          {/* Filters */}
          <div className="product-sales-filters">
            <div className="product-sales-date-filter">
              <label className="product-sales-label">Filter by Date Range</label>
              <div className="product-sales-date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="product-sales-date-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="product-sales-date-input"
                />
              </div>
            </div>
            <div className="product-sales-filter">
              <label className="product-sales-label">Filter by Product Name</label>
              <select
                value={productNameFilter}
                onChange={(e) => setProductNameFilter(e.target.value)}
                className="product-sales-select"
              >
                <option value="">All Products</option>
                {uniqueProductNames.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="product-sales-filter">
              <label className="product-sales-label">Filter by Pharmacy</label>
              <select
                value={pharmacyNameFilter}
                onChange={(e) => setPharmacyNameFilter(e.target.value)}
                className="product-sales-select"
              >
                <option value="">All Pharmacies</option>
                {uniquePharmacies.map(pharmacy => (
                  <option key={pharmacy} value={pharmacy}>
                    {pharmacy}
                  </option>
                ))}
              </select>
            </div>
            <div className="product-sales-filter">
              <label className="product-sales-label">Filter by Rep</label>
              <select
                value={repNameFilter}
                onChange={(e) => setRepNameFilter(e.target.value)}
                className="product-sales-select"
              >
                <option value="">All Reps</option>
                {uniqueRepNames.map(rep => (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <div className="product-sales-loading">Loading...</div>}
          {error && <div className="product-sales-error">{error}</div>}
          {!loading && !error && (
            <>
              {productData.length === 0 && repData.length === 0 ? (
                <div className="product-sales-no-data">No data available for the selected filters.</div>
              ) : (
                <>
                  {/* Product-wise Summary Metrics */}
                  <div className="product-sales-totals">
                    <h2 className="product-sales-section-title">Product Sales Overview</h2>
                    <div className="product-sales-totals-grid">
                      <div>
                        <p className="product-sales-label">Total Sales Value</p>
                        <p className="product-sales-value product-sales-blue">{totalSalesValue}</p>
                      </div>
                      <div>
                        <p className="product-sales-label">Total Quantity Sold</p>
                        <p className="product-sales-value product-sales-blue">{totalQuantitySold}</p>
                      </div>
                      <div>
                        <p className="product-sales-label">Total Order Count</p>
                        <p className="product-sales-value product-sales-blue">{totalOrderCount}</p>
                      </div>
                      <div>
                        <p className="product-sales-label">Average Unit Price</p>
                        <p className="product-sales-value product-sales-green">{avgUnitPrice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart: Sales Value and Quantity by Product */}
                  {productData.length > 0 && (
                    <div className="product-sales-chart">
                      <h2 className="product-sales-section-title">Sales Value and Quantity by Product</h2>
                      <div className="product-sales-chart-container">
                        <Bar
                          data={barData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: { beginAtZero: true, title: { display: true, text: 'Amount' } },
                              x: { title: { display: true, text: 'Product' } },
                            },
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pie Chart: Sales Distribution by Pharmacy */}
                  {Object.keys(pharmacySales).length > 0 && (
                    <div className="product-sales-chart">
                      <h2 className="product-sales-section-title">
                        Sales Distribution by Pharmacy (Top 5 Products)
                      </h2>
                      <div className="product-sales-chart-container">
                        <Pie
                          data={pieData}
                          options={{ responsive: true, maintainAspectRatio: false }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Product-wise Detailed Table */}
                  {productData.length > 0 && (
                    <div className="product-sales-table">
                      <h2 className="product-sales-section-title">Product Sales Details</h2>
                      <div className="product-sales-table-wrapper">
                        <table className="product-sales-table-content">
                          <thead className="product-sales-table-header">
                            <tr>
                              <th className="product-sales-table-header-cell">Product Name</th>
                              <th className="product-sales-table-header-cell">Total Quantity Sold</th>
                              <th className="product-sales-table-header-cell">Total Sales Value</th>
                              <th className="product-sales-table-header-cell">Average Unit Price</th>
                              <th className="product-sales-table-header-cell">Order Count</th>
                              <th className="product-sales-table-header-cell">Pharmacies</th>
                            </tr>
                          </thead>
                          <tbody className="product-sales-table-body">
                            {productData.map((item) => (
                              <tr key={item.productName || 'unknown'}>
                                <td className="product-sales-table-cell">{item.productName || 'Unknown'}</td>
                                <td className="product-sales-table-cell">{item.totalQuantity || 0}</td>
                                <td className="product-sales-table-cell">{item.totalSalesValue || '0.00'}</td>
                                <td className="product-sales-table-cell">{item.avgUnitPrice || '0.00'}</td>
                                <td className="product-sales-table-cell">{item.orderCount || 0}</td>
                                <td className="product-sales-table-cell">
                                  {(item.pharmacies || []).join(', ') || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rep-wise Product Sales Section */}
                  {repData.length > 0 && (
                    <>
                      {/* Stacked Bar Chart: Rep-wise Product Sales */}
                      <div className="product-sales-chart">
                        <h2 className="product-sales-section-title">Rep-wise Product Sales</h2>
                        <div className="product-sales-chart-container">
                          <Bar
                            data={repBarData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                x: { stacked: true, title: { display: true, text: 'Rep' } },
                                y: {
                                  stacked: true,
                                  beginAtZero: true,
                                  title: { display: true, text: 'Sales Value' },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>

                      {/* Top Product per Rep Table */}
                      <div className="product-sales-table">
                        <h2 className="product-sales-section-title">Top Product per Rep</h2>
                        <div className="product-sales-table-wrapper">
                          <table className="product-sales-table-content">
                            <thead className="product-sales-table-header">
                              <tr>
                                <th className="product-sales-table-header-cell">Rep Name</th>
                                <th className="product-sales-table-header-cell">Top Product</th>
                                <th className="product-sales-table-header-cell">Sales Value</th>
                              </tr>
                            </thead>
                            <tbody className="product-sales-table-body">
                              {topProductsByRep.map((item, index) => (
                                <tr key={uniqueReps[index] || `rep-${index}`}>
                                  <td className="product-sales-table-cell">{uniqueReps[index] || 'Unknown'}</td>
                                  <td className="product-sales-table-cell">{item.productName || 'N/A'}</td>
                                  <td className="product-sales-table-cell">{item.totalSalesValue || '0.00'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Detailed Rep-wise Product Sales Table */}
                      <div className="product-sales-table">
                        <h2 className="product-sales-section-title">Rep-wise Product Sales Details</h2>
                        <div className="product-sales-table-wrapper">
                          <table className="product-sales-table-content">
                            <thead className="product-sales-table-header">
                              <tr>
                                <th className="product-sales-table-header-cell">Rep Name</th>
                                <th className="product-sales-table-header-cell">Product Name</th>
                                <th className="product-sales-table-header-cell">Total Quantity Sold</th>
                                <th className="product-sales-table-header-cell">Total Sales Value</th>
                              </tr>
                            </thead>
                            <tbody className="product-sales-table-body">
                              {repData.map((item, index) => (
                                <tr key={`${item.repName || 'unknown'}-${item.productName || 'unknown'}-${index}`}>
                                  <td className="product-sales-table-cell">{item.repName || 'Unknown'}</td>
                                  <td className="product-sales-table-cell">{item.productName || 'Unknown'}</td>
                                  <td className="product-sales-table-cell">{item.totalQuantity || 0}</td>
                                  <td className="product-sales-table-cell">{item.totalSalesValue || '0.00'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSalesReport;