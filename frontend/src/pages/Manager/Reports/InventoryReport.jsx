import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import html2canvas from 'html2canvas';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './InventoryReport.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const InventoryReport = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalPieRef = useRef(null);
  const barChartRef = useRef(null);
  const supplierPieRefs = useRef([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/reports/analytics');
        setAnalytics(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch analytics data');
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportPDF = async () => {
    if (!analytics || loading) return;

    // Generate chart images
    const totalPieChart = await getChartImage(totalPieRef.current);
    const barChart = await getChartImage(barChartRef.current);
    const supplierPieCharts = await Promise.all(
      supplierPieRefs.current.map(ref => getChartImage(ref))
    );

    const dataToSend = {
      analytics,
      charts: {
        totalPieChart,
        barChart,
        supplierPieCharts
      }
    };

    try {
      const response = await axios.post('http://localhost:5000/api/reports/analytics/pdf', dataToSend, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ram_medical_inventory_report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF');
    }
  };

  const getChartImage = async (chartRef) => {
    if (!chartRef) return null;
    const canvas = await html2canvas(chartRef);
    return canvas.toDataURL('image/png');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  // Total Pie Chart Data
  const totalPieData = {
    labels: ['Non-Expired Value', 'Expired Value'],
    datasets: [
      {
        data: [
          analytics.totalValue - analytics.totalExpiredValue,
          analytics.totalExpiredValue
        ],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384']
      }
    ]
  };

  // Bar Chart Data (Top 6 Suppliers by Total Value)
  const topSuppliers = analytics.supplierAnalytics
    .sort((a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue))
    .slice(0, 6);

  const barData = {
    labels: topSuppliers.map(s => s.supplierName),
    datasets: [
      {
        label: 'Total Value',
        data: topSuppliers.map(s => parseFloat(s.totalValue)),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1
      }
    ]
  };

  // Supplier Pie Charts Data
  const supplierPieCharts = topSuppliers.map(supplier => ({
    supplierName: supplier.supplierName,
    data: {
      labels: ['Non-Expired Value', 'Expired Value'],
      datasets: [
        {
          data: [
            parseFloat(supplier.totalValue) - parseFloat(supplier.expiredValue),
            parseFloat(supplier.expiredValue)
          ],
          backgroundColor: ['#36A2EB', '#FF6384'],
          hoverBackgroundColor: ['#36A2EB', '#FF6384']
        }
      ]
    }
  }));

  // Function to format date to dd.mm.yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="inventory-report-container">
      <MNavbar />
      <div className="inventory-report-content">
        <MSidebar />
        <div className="inventory-report-main">
          <h1 className="report-heading">Inventory Status Report</h1>
          <p className="text-gray-600 mb-8">Detailed information about current stock levels, item availability, and inventory valuations.</p>

          {/* Export to PDF Button - Moved to right side */}
          <div className="export-pdf-button-container">
            <button
              onClick={handleExportPDF}
              className="export-pdf-button"
            >
              Export to PDF
            </button>
          </div>

          {/* Total Value and Expired Value */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Expired Value</p>
                <p className="text-2xl font-bold text-red-600">{analytics.totalExpiredValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Total Expired Percentage Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Total Expired Percentage</h2>
            <div className="chart-container" ref={totalPieRef}>
              <Pie data={totalPieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <p className="text-center text-gray-600 mt-2">Expired: {analytics.totalExpiredPercentage}</p>
          </div>

          {/* Supplier Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Supplier Total Value</h2>
            <div className="chart-container" ref={barChartRef}>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Total Value (Rs)' } },
                    x: { title: { display: true, text: 'Supplier' } }
                  }
                }}
              />
            </div>
          </div>

          {/* Supplier Pie Charts */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Supplier Expiry Breakdown</h2>
            <div className="grid grid-cols-3 gap-6 inventory-report-pie-grid">
              {supplierPieCharts.map((chart, index) => (
                <div key={index} className="supplier-pie-container" ref={el => supplierPieRefs.current[index] = el}>
                  <h3 className="text-md font-medium text-gray-700 mb-2">{chart.supplierName}</h3>
                  <div className="chart-container">
                    <Pie data={chart.data} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                  <p className="text-center text-gray-600 mt-2">
                    Expired: {topSuppliers[index].expiredPercentage}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Product Table */}
          <div className="inventory-report-table">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Product List</h2>
            <div className="inventory-report-table-wrapper">
              <table className="inventory-report-table-content">
                <thead className="inventory-report-table-header">
                  <tr>
                    <th className="inventory-report-table-header-cell">Product ID</th>
                    <th className="inventory-report-table-header-cell">Name</th>
                    <th className="inventory-report-table-header-cell">Batch Number</th>
                    <th className="inventory-report-table-header-cell">Expiry Date</th>
                    <th className="inventory-report-table-header-cell">Total Price</th>
                  </tr>
                </thead>
                <tbody className="inventory-report-table-body">
                  {analytics.products.map(product => (
                    <tr key={product.productId}>
                      <td className="inventory-report-table-cell">{product.productId}</td>
                      <td className="inventory-report-table-cell">{product.name}</td>
                      <td className="inventory-report-table-cell">{product.batchNumber}</td>
                      <td className="inventory-report-table-cell">{formatDate(product.expiryDate)}</td>
                      <td className="inventory-report-table-cell">{product.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;