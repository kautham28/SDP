import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { saveAs } from 'file-saver';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './OrderSummaryReport.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const OrderSummaryReport = () => {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pieChartRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch summary data
      const summaryResponse = await axios.get('http://localhost:5000/api/reports/order-report/summary', {
        params: { startDate, endDate }
      });
      setSummary(summaryResponse.data.data);

      // Fetch details data
      const detailsResponse = await axios.get('http://localhost:5000/api/reports/order-report/details', {
        params: { startDate, endDate }
      });
      setDetails(detailsResponse.data.data.orders);
    } catch (err) {
      setError('Failed to fetch order report data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pie chart data for confirmed percentage
  const pieData = summary && {
    labels: ['Confirmed', 'Pending'],
    datasets: [
      {
        data: [
          summary.confirmedOrdersCount,
          summary.pendingOrdersCount
        ],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384']
      }
    ]
  };

  // Export PDF function
  const exportPDF = async () => {
    try {
      const pieChartDataUrl = pieChartRef.current?.toBase64Image();
      const pdfData = {
        reportType: 'Order Summary Report',
        filters: { startDate, endDate },
        summary: {
          totalOrders: summary.totalOrders,
          pendingOrdersCount: summary.pendingOrdersCount,
          confirmedOrdersCount: summary.confirmedOrdersCount,
          totalOrderValue: summary.totalOrderValue,
          confirmedPercentage: summary.confirmedPercentage
        },
        tableData: details,
        charts: {
          pieChart: pieChartDataUrl
        }
      };
      console.log('Sending tableData with', pdfData.tableData.length, 'rows');
      const response = await axios.post('http://localhost:5000/api/reports/order-report/pdf', pdfData, {
        responseType: 'blob'
      });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(pdfBlob, 'ram_medical_order_summary_report.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  return (
    <div className="order-summary-container">
      <MNavbar />
      <div className="order-summary-content">
        <MSidebar />
        <div className="order-summary-main">
          <h1 className="order-summary-heading">Order Summary Report</h1>
          <p className="order-summary-description">View comprehensive summaries of orders including order volumes, values, and fulfillment status.</p>

          {/* Date Filter and Export Button */}
          <div className="order-summary-date-filter">
            <label className="order-summary-date-label">Filter by Date Range</label>
            <div className="order-summary-date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="order-summary-date-input"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="order-summary-date-input"
              />
              <button onClick={exportPDF} className="order-summary-export-button">
                Export as PDF
              </button>
            </div>
          </div>

          {loading && <div className="order-summary-loading">Loading...</div>}
          {error && <div className="order-summary-error">{error}</div>}
          {!loading && !error && summary && (
            <>
              {/* Total Values */}
              <div className="order-summary-totals">
                <h2 className="order-summary-section-title">Order Overview</h2>
                <div className="order-summary-totals-grid">
                  <div>
                    <p className="order-summary-label">Total Orders</p>
                    <p className="order-summary-value order-summary-blue">{summary.totalOrders}</p>
                  </div>
                  <div>
                    <p className="order-summary-label">Pending Orders</p>
                    <p className="order-summary-value order-summary-yellow">{summary.pendingOrdersCount}</p>
                  </div>
                  <div>
                    <p className="order-summary-label">Confirmed Orders</p>
                    <p className="order-summary-value order-summary-green">{summary.confirmedOrdersCount}</p>
                  </div>
                  <div>
                    <p className="order-summary-label">Total Value</p>
                    <p className="order-summary-value order-summary-blue">{summary.totalOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="order-summary-full-width">
                    <p className="order-summary-label">Confirmed Percentage</p>
                    <p className="order-summary-value order-summary-green">{summary.confirmedPercentage}</p>
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="order-summary-chart">
                <h2 className="order-summary-section-title">Order Status Distribution</h2>
                <div className="order-summary-chart-container">
                  <Pie
                    data={pieData}
                    options={{ responsive: true, maintainAspectRatio: false }}
                    ref={pieChartRef}
                  />
                </div>
              </div>

              {/* Order Table */}
              <div className="order-summary-table">
                <h2 className="order-summary-section-title">Order Details</h2>
                <div className="order-summary-table-wrapper">
                  <table className="order-summary-table-content">
                    <thead className="order-summary-table-header">
                      <tr>
                        <th className="order-summary-table-header-cell">Order ID</th>
                        <th className="order-summary-table-header-cell">Pharmacy Name</th>
                        <th className="order-summary-table-header-cell">Rep Name</th>
                        <th className="order-summary-table-header-cell">Total Value</th>
                        <th className="order-summary-table-header-cell">Order Date</th>
                        <th className="order-summary-table-header-cell">User ID</th>
                        <th className="order-summary-table-header-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="order-summary-table-body">
                      {details.map((order) => (
                        <tr key={order.orderId}>
                          <td className="order-summary-table-cell">{order.orderId}</td>
                          <td className="order-summary-table-cell">{order.pharmacyName}</td>
                          <td className="order-summary-table-cell">{order.repName}</td>
                          <td className="order-summary-table-cell">{order.totalValue}</td>
                          <td className="order-summary-table-cell">{order.orderDate}</td>
                          <td className="order-summary-table-cell">{order.userId}</td>
                          <td className="order-summary-table-cell">{order.status}</td>
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

export default OrderSummaryReport;