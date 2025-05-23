import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './ProductSalesReport.css';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const ProductSalesReport = () => {
  const [productData, setProductData] = useState([]);
  const [repData, setRepData] = useState([]);
  const [fastMovingData, setFastMovingData] = useState([]); // New state for fast-moving products
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productNameFilter, setProductNameFilter] = useState('');
  const [pharmacyNameFilter, setPharmacyNameFilter] = useState('');
  const [repNameFilter, setRepNameFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

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

      if (response.data.success) {
        setProductData(response.data.data?.productSummary || []);
        setRepData(response.data.data?.repProductSummary || []);
        setFastMovingData(response.data.data?.fastMovingProducts || []); // Set fast-moving data
      } else {
        throw new Error('API returned unsuccessful response: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching data:', err.message, err.response?.data);
      setError('Failed to fetch product sales report data. Please check the server logs or try again later.');
      setProductData([]);
      setRepData([]);
      setFastMovingData([]);
    } finally {
      setLoading(false);
    }
  };

  // Product-wise Summary Metrics
  const totalSalesValue = productData.length > 0
    ? productData.reduce((sum, item) => sum + parseFloat(item.totalSalesValue || 0), 0).toFixed(2)
    : '0.00';
  const totalQuantitySold = productData.length > 0
    ? productData.reduce((sum, item) => sum + (parseInt(item.totalQuantity) || 0), 0)
    : 0;
  const totalOrderCount = productData.length > 0
    ? productData.reduce((sum, item) => sum + (parseInt(item.orderCount) || 0), 0)
    : 0;
  const avgUnitPrice = productData.length > 0
    ? (productData.reduce((sum, item) => sum + parseFloat(item.avgUnitPrice || 0), 0) / productData.length).toFixed(2)
    : '0.00';

  // Bar Chart: Sales Value and Quantity by Product
  const barData = {
    labels: productData.slice(0, 10).map(item => item.productName || 'Unknown'),
    datasets: [
      {
        label: 'Total Sales Value',
        data: productData.slice(0, 10).map(item => parseFloat(item.totalSalesValue || 0)),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
      {
        label: 'Total Quantity Sold',
        data: productData.slice(0, 10).map(item => parseInt(item.totalQuantity) || 0),
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
        borderWidth: 1,
      },
    ],
  };

  // Pie Chart: Sales Distribution by Pharmacy (for top products)
  const topProducts = productData.slice(0, 5);
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

  // Function to generate PDF report
  const generatePDF = async () => {
    setGeneratingPdf(true);
    setError(null);

    try {
      let barChartImage = null;
      let pieChartImage = null;

      if (barChartRef.current) {
        barChartImage = barChartRef.current.toBase64Image();
      }

      if (pieChartRef.current) {
        pieChartImage = pieChartRef.current.toBase64Image();
      }

      const response = await axios.post(
        'http://localhost:5000/api/reports/generate-product-sales-pdf',
        {
          reportType: 'Product Sales Report',
          filters: {
            startDate,
            endDate,
            productName: productNameFilter,
            pharmacyName: pharmacyNameFilter,
            repName: repNameFilter,
          },
          summary: {
            totalSalesValue,
            totalQuantitySold,
            totalOrderCount,
            avgUnitPrice,
          },
          productData,
          repData,
          fastMovingData, // Include fast-moving data
          charts: {
            barChart: barChartImage,
            pieChart: pieChartImage,
          },
        },
        {
          responseType: 'blob',
          timeout: 60000,
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, `Product_Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingPdf(false);
    }
  };

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

          <button
            onClick={generatePDF}
            disabled={loading || generatingPdf || productData.length === 0}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem',
              alignSelf: 'flex-end',
            }}
          >
            {generatingPdf ? 'Generating PDF...' : 'Export as PDF'}
          </button>

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
              {productData.length === 0 && repData.length === 0 && fastMovingData.length === 0 ? (
                <div className="product-sales-no-data">No data available for the selected filters.</div>
              ) : (
                <>
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
                          ref={barChartRef}
                        />
                      </div>
                    </div>
                  )}

                  {Object.keys(pharmacySales).length > 0 && (
                    <div className="product-sales-chart">
                      <h2 className="product-sales-section-title">
                        Sales Distribution by Pharmacy (Top 5 Products)
                      </h2>
                      <div className="product-sales-chart-container">
                        <Pie
                          data={pieData}
                          options={{ responsive: true, maintainAspectRatio: false }}
                          ref={pieChartRef}
                        />
                      </div>
                    </div>
                  )}

                  {fastMovingData.length > 0 && (
                    <div className="product-sales-table">
                      <h2 className="product-sales-section-title">Fast Moving Products (Top 5)</h2>
                      <div className="product-sales-table-wrapper">
                        <table className="product-sales-table-content">
                          <thead className="product-sales-table-header">
                            <tr>
                              <th className="product-sales-table-header-cell">Product Name</th>
                              <th className="product-sales-table-header-cell">Total Quantity Sold</th>
                              <th className="product-sales-table-header-cell">Total Sales Value</th>
                              <th className="product-sales-table-header-cell">Order Count</th>
                            </tr>
                          </thead>
                          <tbody className="product-sales-table-body">
                            {fastMovingData.map((item, index) => (
                              <tr key={`${item.productName}-${index}`}>
                                <td className="product-sales-table-cell">{item.productName || 'Unknown'}</td>
                                <td className="product-sales-table-cell">{item.totalQuantity || 0}</td>
                                <td className="product-sales-table-cell">{item.totalSalesValue || '0.00'}</td>
                                <td className="product-sales-table-cell">{item.orderCount || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

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
                            {productData.map((item, index) => (
                              <tr key={`${item.productName}-${index}`}>
                                <td className="product-sales-table-cell">{item.productName || 'Unknown'}</td>
                                <td className="product-sales-table-cell">{item.totalQuantity || 0}</td>
                                <td className="product-sales-table-cell">{item.totalSalesValue || '0.00'}</td>
                                <td className="product-sales-table-cell">{item.avgUnitPrice || '0.00'}</td>
                                <td className="product-sales-table-cell">{item.orderCount || 0}</td>
                                <td className="product-sales-table-cell">
                                  {(item.pharmacies || []).slice(0, 3).join(', ')}
                                  {(item.pharmacies || []).length > 3 ? '...' : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {repData.length > 0 && (
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
                              <tr key={`${item.repName}-${item.productName}-${index}`}>
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