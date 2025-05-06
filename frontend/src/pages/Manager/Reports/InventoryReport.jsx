import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './InventoryReport.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const InventoryReport = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="inventory-report-container min-h-screen bg-gray-50">
      <MNavbar />
      <div className="inventory-report-content flex">
        <MSidebar />
        <div className="inventory-report-main p-6 flex-1 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-2">Inventory Status Report</h1>
          <p className="text-gray-600 mb-8">Detailed information about current stock levels, item availability, and inventory valuations.</p>

          {/* Total Value and Expired Value */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">${analytics.totalValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Expired Value</p>
                <p className="text-2xl font-bold text-red-600">${analytics.totalExpiredValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Total Expired Percentage Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Total Expired Percentage</h2>
            <div className="chart-container">
              <Pie data={totalPieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <p className="text-center text-gray-600 mt-2">Expired: {analytics.totalExpiredPercentage}</p>
          </div>

          {/* Supplier Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Supplier Total Value</h2>
            <div className="chart-container">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Total Value ($)' } },
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
                <div key={index} className="supplier-pie-container">
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Product List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 w-full inventory-report-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.products.map(product => (
                    <tr key={product.productId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.productId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.batchNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.expiryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.totalPrice}</td>
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