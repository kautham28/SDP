import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { saveAs } from 'file-saver';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './PharmacySalesReport.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const PharmacySalesReport = () => {
  const [summary, setSummary] = useState([]);
  const [details, setDetails] = useState([]);
  const [topPharmacies, setTopPharmacies] = useState([]); // New state for top pharmacies
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedPharmacy]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/reports/pharmacy-sales-report', {
        params: { startDate, endDate, pharmacy_name: selectedPharmacy || undefined }
      });
      if (response.data.success) {
        setSummary(response.data.data.summary || []);
        setDetails(response.data.data.details || []);
        setTopPharmacies(response.data.data.topPharmacies || []); // Set top pharmacies data
      } else {
        throw new Error('API returned unsuccessful response: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Failed to fetch pharmacy sales report data');
      console.error('Error fetching data:', err);
      setSummary([]);
      setDetails([]);
      setTopPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  // Bar chart data for sales by pharmacy
  const barData = {
    labels: summary.map(item => item.pharmacy_name),
    datasets: [
      {
        label: 'Total Sales',
        data: summary.map(item => parseFloat(item.totalSales)),
        backgroundColor: '#36A2EB',
        borderColor: '#2B82C5',
        borderWidth: 1
      }
    ]
  };

  // Pie chart data for order status (pending vs. confirmed) for the selected pharmacy
  const selectedSummary = summary.find(item => item.pharmacy_name === selectedPharmacy) || {};
  const totalOrders = selectedSummary.totalOrders || 0;
  const confirmedOrders = totalOrders > 0 
    ? (parseFloat(selectedSummary.confirmedPercentage) / 100) * totalOrders 
    : 0;
  const pendingOrders = totalOrders - confirmedOrders;

  const pieData = selectedPharmacy && totalOrders > 0 ? {
    labels: ['Confirmed', 'Pending'],
    datasets: [
      {
        data: [confirmedOrders, pendingOrders],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384']
      }
    ]
  } : null;

  // Unique pharmacies for dropdown
  const pharmacies = [...new Set(summary.map(item => item.pharmacy_name))];

  // Export PDF function
  const exportPDF = async () => {
    try {
      const barChartDataUrl = !selectedPharmacy ? barChartRef.current?.toBase64Image() : null;
      const pieChartDataUrl = selectedPharmacy ? pieChartRef.current?.toBase64Image() : null;
      const pdfData = {
        reportType: 'Pharmacy-wise Sales Report',
        filters: { startDate, endDate, pharmacy_name: selectedPharmacy || undefined },
        summary: selectedPharmacy ? selectedSummary : summary,
        tableData: details,
        topPharmacies, // Include top pharmacies data
        charts: {
          barChart: barChartDataUrl,
          pieChart: pieChartDataUrl
        }
      };
      console.log('Sending PDF data:', {
        tableDataRows: pdfData.tableData.length,
        topPharmaciesRows: pdfData.topPharmacies.length
      });
      const response = await axios.post('http://localhost:5000/api/reports/pharmacy-sales-report/pdf', pdfData, {
        responseType: 'blob'
      });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(pdfBlob, 'ram_medical_pharmacy_sales_report.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="pharmacy-sales-container">
      <MNavbar />
      <div className="pharmacy-sales-content">
        <MSidebar />
        <div className="pharmacy-sales-main">
          <h1 className="pharmacy-sales-heading">Pharmacy-wise Sales Report</h1>
          <p className="pharmacy-sales-description">Examine sales data across different pharmacy locations, including revenue and order distribution.</p>

          {/* Filters */}
          <div className="pharmacy-sales-filters">
            <div className="pharmacy-sales-date-filter">
              <label className="pharmacy-sales-date-label">Filter by Date Range</label>
              <div className="pharmacy-sales-date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pharmacy-sales-date-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pharmacy-sales-date-input"
                />
              </div>
            </div>
            <div className="pharmacy-sales-pharmacy-filter">
              <label className="pharmacy-sales-pharmacy-label">Select Pharmacy</label>
              <select
                value={selectedPharmacy}
                onChange={(e) => setSelectedPharmacy(e.target.value)}
                className="pharmacy-sales-pharmacy-select"
              >
                <option value="">All Pharmacies</option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy} value={pharmacy}>{pharmacy}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={exportPDF} 
              className="pharmacy-sales-export-button"
              disabled={loading || summary.length === 0}
            >
              Export as PDF
            </button>
          </div>

          {loading && <div className="pharmacy-sales-loading">Loading...</div>}
          {error && <div className="pharmacy-sales-error">{error}</div>}
          {!loading && !error && (summary.length > 0 || details.length > 0 || topPharmacies.length > 0) ? (
            <>
              {/* Summary Metrics */}
              <div className="pharmacy-sales-totals">
                <h2 className="pharmacy-sales-section-title">Sales Overview</h2>
                <div className="pharmacy-sales-totals-grid">
                  {selectedPharmacy ? (
                    <>
                      <div>
                        <p className="pharmacy-sales-label">Total Orders</p>
                        <p className="pharmacy-sales-value pharmacy-sales-blue">{selectedSummary.totalOrders || 0}</p>
                      </div>
                      <div>
                        <p className="pharmacy-sales-label">Total Sales</p>
                        <p className="pharmacy-sales-value pharmacy-sales-blue">{selectedSummary.totalSales || '0.00'}</p>
                      </div>
                      <div>
                        <p className="pharmacy-sales-label">Average Order Value</p>
                        <p className="pharmacy-sales-value pharmacy-sales-blue">{selectedSummary.avgOrderValue || '0.00'}</p>
                      </div>
                      <div>
                        <p className="pharmacy-sales-label">Confirmed Percentage</p>
                        <p className="pharmacy-sales-value pharmacy-sales-green">{selectedSummary.confirmedPercentage || '0.00%'}</p>
                      </div>
                    </>
                  ) : (
                    summary.map(item => (
                      <div key={item.pharmacy_name}>
                        <p className="pharmacy-sales-label">{item.pharmacy_name}</p>
                        <p className="pharmacy-sales-value pharmacy-sales-blue">{item.totalSales}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Pharmacies Table */}
              {!selectedPharmacy && topPharmacies.length > 0 && (
                <div className="pharmacy-sales-table">
                  <h2 className="pharmacy-sales-section-title">Top Pharmacies (by Total Sales)</h2>
                  <div className="pharmacy-sales-table-wrapper">
                    <table className="pharmacy-sales-table-content">
                      <thead className="pharmacy-sales-table-header">
                        <tr>
                          <th className="pharmacy-sales-table-header-cell">Pharmacy Name</th>
                          <th className="pharmacy-sales-table-header-cell">Total Orders</th>
                          <th className="pharmacy-sales-table-header-cell">Total Sales</th>
                          <th className="pharmacy-sales-table-header-cell">Average Order Value</th>
                        </tr>
                      </thead>
                      <tbody className="pharmacy-sales-table-body">
                        {topPharmacies.map((pharmacy, index) => (
                          <tr key={`${pharmacy.pharmacy_name}-${index}`}>
                            <td className="pharmacy-sales-table-cell">{pharmacy.pharmacy_name || 'Unknown'}</td>
                            <td className="pharmacy-sales-table-cell">{pharmacy.totalOrders || 0}</td>
                            <td className="pharmacy-sales-table-cell">{pharmacy.totalSales || '0.00'}</td>
                            <td className="pharmacy-sales-table-cell">{pharmacy.avgOrderValue || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bar Chart: Sales by Pharmacy */}
              {!selectedPharmacy && (
                <div className="pharmacy-sales-chart">
                  <h2 className="pharmacy-sales-section-title">Sales by Pharmacy</h2>
                  <div className="pharmacy-sales-chart-container">
                    <Bar
                      data={barData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: { beginAtZero: true, title: { display: true, text: 'Sales' } },
                          x: { title: { display: true, text: 'Pharmacy' } }
                        }
                      }}
                      ref={barChartRef}
                    />
                  </div>
                </div>
              )}

              {/* Pie Chart: Order Status for Selected Pharmacy */}
              {selectedPharmacy && pieData && (
                <div className="pharmacy-sales-chart">
                  <h2 className="pharmacy-sales-section-title">Order Status Distribution - {selectedPharmacy}</h2>
                  <div className="pharmacy-sales-chart-container">
                    <Pie
                      data={pieData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                      ref={pieChartRef}
                    />
                  </div>
                </div>
              )}

              {/* Detailed Table */}
              {details.length > 0 && (
                <div className="pharmacy-sales-table">
                  <h2 className="pharmacy-sales-section-title">Order Details</h2>
                  <div className="pharmacy-sales-table-wrapper">
                    <table className="pharmacy-sales-table-content">
                      <thead className="pharmacy-sales-table-header">
                        <tr>
                          <th className="pharmacy-sales-table-header-cell">Pharmacy Name</th>
                          <th className="pharmacy-sales-table-header-cell">Order ID</th>
                          <th className="pharmacy-sales-table-header-cell">Rep Name</th>
                          <th className="pharmacy-sales-table-header-cell">Total Value</th>
                          <th className="pharmacy-sales-table-header-cell">Order Date</th>
                          <th className="pharmacy-sales-table-header-cell">Status</th>
                          <th className="pharmacy-sales-table-header-cell">User ID</th>
                        </tr>
                      </thead>
                      <tbody className="pharmacy-sales-table-body">
                        {details.map((order) => (
                          <tr key={order.orderId}>
                            <td className="pharmacy-sales-table-cell">{order.pharmacy_name}</td>
                            <td className="pharmacy-sales-table-cell">{order.orderId}</td>
                            <td className="pharmacy-sales-table-cell">{order.repName}</td>
                            <td className="pharmacy-sales-table-cell">{order.totalValue}</td>
                            <td className="pharmacy-sales-table-cell">{order.orderDate}</td>
                            <td className="pharmacy-sales-table-cell">{order.status}</td>
                            <td className="pharmacy-sales-table-cell">{order.userId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : !loading && !error && (
            <div className="pharmacy-sales-no-data">No data available for the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacySalesReport;