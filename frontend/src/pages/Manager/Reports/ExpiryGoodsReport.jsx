import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './ExpiryGoodsReport.css';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const ExpiryGoodsReport = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedSupplier]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/reports/expiry-goods-report', {
        params: { startDate, endDate, supplierName: selectedSupplier || undefined }
      });
      setData(response.data.data);
    } catch (err) {
      setError('Failed to fetch expiry goods report data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Summary Metrics
  const expiredGoods = data.filter(item => item.status === 'Expired');
  const expiringSoonGoods = data.filter(item => item.status === 'Expiring Soon');
  const totalExpiredQuantity = expiredGoods.reduce((sum, item) => sum + item.quantity, 0);
  const totalExpiringSoonQuantity = expiringSoonGoods.reduce((sum, item) => sum + item.quantity, 0);
  const totalValueAtRisk = [...expiredGoods, ...expiringSoonGoods]
    .reduce((sum, item) => sum + parseFloat(item.totalPrice), 0)
    .toFixed(2);

  // Bar Chart: Expiring goods by supplier
  const suppliers = [...new Set(data.map(item => item.supplierName))];
  const barData = {
    labels: suppliers,
    datasets: [
      {
        label: 'Expired Quantity',
        data: suppliers.map(supplier => {
          const supplierExpired = data.filter(item => item.supplierName === supplier && item.status === 'Expired');
          return supplierExpired.reduce((sum, item) => sum + item.quantity, 0);
        }),
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
        borderWidth: 1
      },
      {
        label: 'Expiring Soon Quantity',
        data: suppliers.map(supplier => {
          const supplierExpiringSoon = data.filter(item => item.supplierName === supplier && item.status === 'Expiring Soon');
          return supplierExpiringSoon.reduce((sum, item) => sum + item.quantity, 0);
        }),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1
      }
    ]
  };

  // Pie Chart: Distribution by status
  const statusCounts = {
    Expired: data.filter(item => item.status === 'Expired').length,
    ExpiringSoon: data.filter(item => item.status === 'Expiring Soon').length,
    Valid: data.filter(item => item.status === 'Valid').length
  };

  const pieData = {
    labels: ['Expired', 'Expiring Soon', 'Valid'],
    datasets: [
      {
        data: [statusCounts.Expired, statusCounts.ExpiringSoon, statusCounts.Valid],
        backgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#4BC0C0']
      }
    ]
  };

  // Unique suppliers for dropdown
  const uniqueSuppliers = suppliers.filter(supplier => supplier !== 'N/A');

  // Function to generate PDF report
  const generatePDF = async () => {
    setGeneratingPdf(true);
    
    try {
      // Get chart images as base64
      let barChartImage = null;
      let pieChartImage = null;
      
      if (barChartRef.current) {
        barChartImage = barChartRef.current.toBase64Image();
      }
      
      if (pieChartRef.current) {
        pieChartImage = pieChartRef.current.toBase64Image();
      }
      
      // Send data to backend to generate PDF
      const response = await axios.post('http://localhost:5000/api/reports/expiry-goods-pdf', {
        reportType: 'Expiry Goods Report',
        filters: { startDate, endDate, supplierName: selectedSupplier },
        summary: { totalExpiredQuantity, totalExpiringSoonQuantity, totalValueAtRisk },
        tableData: data,
        charts: {
          barChart: barChartImage,
          pieChart: pieChartImage
        }
      }, { responseType: 'blob' });
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Save the file using FileSaver.js
      saveAs(blob, `Expiry_Goods_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="expiry-goods-container">
      <MNavbar />
      <div className="expiry-goods-content">
        <MSidebar />
        <div className="expiry-goods-main">
          <h1 className="expiry-goods-heading">Expiry Goods Report</h1>
          <p className="expiry-goods-description">Track products nearing expiration or already expired to manage inventory effectively.</p>
          
          {/* Export PDF Button */}
          <button 
            onClick={generatePDF}
            disabled={loading || generatingPdf || data.length === 0}
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
              alignSelf: 'flex-end'
            }}
          >
            {generatingPdf ? 'Generating PDF...' : 'Export as PDF'}
          </button>

          {/* Filters */}
          <div className="expiry-goods-filters">
            <div className="expiry-goods-date-filter">
              <label className="expiry-goods-date-label">Filter by Expiry Date Range</label>
              <div className="expiry-goods-date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="expiry-goods-date-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="expiry-goods-date-input"
                />
              </div>
            </div>
            <div className="expiry-goods-supplier-filter">
              <label className="expiry-goods-supplier-label">Select Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="expiry-goods-supplier-select"
              >
                <option value="">All Suppliers</option>
                {uniqueSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && <div className="expiry-goods-loading">Loading...</div>}
          {error && <div className="expiry-goods-error">{error}</div>}
          {!loading && !error && data.length > 0 && (
            <>
              {/* Summary Metrics */}
              <div className="expiry-goods-totals">
                <h2 className="expiry-goods-section-title">Expiry Overview</h2>
                <div className="expiry-goods-totals-grid">
                  <div>
                    <p className="expiry-goods-label">Expired Quantity</p>
                    <p className="expiry-goods-value expiry-goods-red">{totalExpiredQuantity}</p>
                  </div>
                  <div>
                    <p className="expiry-goods-label">Expiring Soon Quantity</p>
                    <p className="expiry-goods-value expiry-goods-blue">{totalExpiringSoonQuantity}</p>
                  </div>
                  <div>
                    <p className="expiry-goods-label">Total Value at Risk</p>
                    <p className="expiry-goods-value expiry-goods-red">{totalValueAtRisk}</p>
                  </div>
                </div>
              </div>

              /* Bar Chart: Expiring goods by supplier */
              <div className="expiry-goods-chart">
                <h2 className="expiry-goods-section-title">Expiring Goods by Supplier</h2>
                <div className="expiry-goods-chart-container">
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Quantity' } },
                        x: { title: { display: true, text: 'Supplier' } }
                      }
                    }}
                    ref={barChartRef}
                  />
                </div>
              </div>

              /* Pie Chart: Status Distribution */
              <div className="expiry-goods-chart">
                <h2 className="expiry-goods-section-title">Status Distribution</h2>
                <div className="expiry-goods-chart-container">
                  <Pie
                    data={pieData}
                    options={{ responsive: true, maintainAspectRatio: false }}
                    ref={pieChartRef}
                  />
                </div>
              </div>

              /* Detailed Table */
              <div className="expiry-goods-table">
                <h2 className="expiry-goods-section-title">Expiry Details</h2>
                <div className="expiry-goods-table-wrapper">
                  <table className="expiry-goods-table-content">
                    <thead className="expiry-goods-table-header">
                      <tr>
                        <th className="expiry-goods-table-header-cell">Product ID</th>
                        <th className="expiry-goods-table-header-cell">Name</th>
                        <th className="expiry-goods-table-header-cell">Batch Number</th>
                        <th className="expiry-goods-table-header-cell">Expiry Date</th>
                        <th className="expiry-goods-table-header-cell">Quantity</th>
                        <th className="expiry-goods-table-header-cell">Unit Price</th>
                        <th className="expiry-goods-table-header-cell">Total Price</th>
                        <th className="expiry-goods-table-header-cell">Supplier Name</th>
                        <th className="expiry-goods-table-header-cell">Days Until Expiry</th>
                        <th className="expiry-goods-table-header-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="expiry-goods-table-body">
                      {data.map((item) => (
                        <tr key={item.productId}>
                          <td className="expiry-goods-table-cell">{item.productId}</td>
                          <td className="expiry-goods-table-cell">{item.name}</td>
                          <td className="expiry-goods-table-cell">{item.batchNumber}</td>
                          <td className="expiry-goods-table-cell">{item.expiryDate}</td>
                          <td className="expiry-goods-table-cell">{item.quantity}</td>
                          <td className="expiry-goods-table-cell">{item.unitPrice}</td>
                          <td className="expiry-goods-table-cell">{item.totalPrice}</td>
                          <td className="expiry-goods-table-cell">{item.supplierName}</td>
                          <td className="expiry-goods-table-cell">{item.daysUntilExpiry}</td>
                          <td className="expiry-goods-table-cell">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpiryGoodsReport;