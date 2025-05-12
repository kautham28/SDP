import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import './RepPerformanceReport.css';
import { saveAs } from 'file-saver';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const RepPerformanceReport = () => {
  const [data, setData] = useState([]);
  const [repId, setRepId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [repId, month, year, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/reports/rep-performance-report', {
        params: { repId, month, year, startDate, endDate }
      });
      setData(response.data.data);
    } catch (err) {
      setError('Failed to fetch rep performance report data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Summary Metrics
  const totalTarget = data.reduce((sum, item) => sum + parseFloat(item.target), 0).toFixed(2);
  const totalSales = data.reduce((sum, item) => sum + parseFloat(item.totalSales), 0).toFixed(2);
  const totalConfirmedSales = data.reduce((sum, item) => sum + parseFloat(item.confirmedSales), 0).toFixed(2);
  const avgPercentage = data.length > 0 
    ? (data.reduce((sum, item) => sum + parseFloat(item.percentage), 0) / data.length).toFixed(2) + '%' 
    : '0.00%';

  // Bar Chart: Target vs Total Sales vs Confirmed Sales
  const barData = {
    labels: data.map(item => `Rep ${item.repId} (${item.month} ${item.year})`),
    datasets: [
      {
        label: 'Target',
        data: data.map(item => parseFloat(item.target)),
        backgroundColor: '#FF6384',
        borderColor: '#FF6384',
        borderWidth: 1
      },
      {
        label: 'Total Sales',
        data: data.map(item => parseFloat(item.totalSales)),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1
      },
      {
        label: 'Confirmed Sales',
        data: data.map(item => parseFloat(item.confirmedSales)),
        backgroundColor: '#4BC0C0',
        borderColor: '#4BC0C0',
        borderWidth: 1
      }
    ]
  };

  // Pie Chart: Performance Status (Above/Below Target)
  const aboveTarget = data.filter(item => parseFloat(item.percentage) >= 100).length;
  const belowTarget = data.filter(item => parseFloat(item.percentage) < 100).length;
  const pieData = {
    labels: ['Above Target', 'Below Target'],
    datasets: [
      {
        data: [aboveTarget, belowTarget],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384']
      }
    ]
  };

  // Unique Rep IDs, Months, and Years for dropdowns
  const uniqueRepIds = [...new Set(data.map(item => item.repId))];
  const uniqueMonths = [...new Set(data.map(item => item.month))];
  const uniqueYears = [...new Set(data.map(item => item.year))];

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
      const response = await axios.post('http://localhost:5000/api/reports/generate-pdf', {
        reportType: 'Rep Performance Report',
        filters: { repId, month, year, startDate, endDate },
        summary: { totalTarget, totalSales, totalConfirmedSales, avgPercentage },
        tableData: data,
        charts: {
          barChart: barChartImage,
          pieChart: pieChartImage
        }
      }, { responseType: 'blob' });
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Save the file using FileSaver.js
      saveAs(blob, `Rep_Performance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="rep-performance-container">
      <MNavbar />
      <div className="rep-performance-content">
        <MSidebar />
        <div className="rep-performance-main">
          <h1 className="rep-performance-heading">Rep Performance Report</h1>
          <p className="rep-performance-description">Evaluate the performance of sales representatives based on targets, sales, and confirmed orders.</p>
          
          {/* Export PDF Button - Added to your existing UI */}
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
          <div className="rep-performance-filters">
            <div className="rep-performance-filter">
              <label className="rep-performance-label">Select Rep</label>
              <select
                value={repId}
                onChange={(e) => setRepId(e.target.value)}
                className="rep-performance-select"
              >
                <option value="">All Reps</option>
                {uniqueRepIds.map(id => (
                  <option key={id} value={id}>Rep {id}</option>
                ))}
              </select>
            </div>
            <div className="rep-performance-filter">
              <label className="rep-performance-label">Select Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rep-performance-select"
              >
                <option value="">All Months</option>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="rep-performance-filter">
              <label className="rep-performance-label">Select Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rep-performance-select"
              >
                <option value="">All Years</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="rep-performance-date-filter">
              <label className="rep-performance-label">Filter by Date Range</label>
              <div className="rep-performance-date-inputs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rep-performance-date-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rep-performance-date-input"
                />
              </div>
            </div>
          </div>

          {loading && <div className="rep-performance-loading">Loading...</div>}
          {error && <div className="rep-performance-error">{error}</div>}
          {!loading && !error && data.length > 0 && (
            <>
              {/* Summary Metrics */}
              <div className="rep-performance-totals">
                <h2 className="rep-performance-section-title">Performance Overview</h2>
                <div className="rep-performance-totals-grid">
                  <div>
                    <p className="rep-performance-label">Total Target</p>
                    <p className="rep-performance-value rep-performance-blue">{totalTarget}</p>
                  </div>
                  <div>
                    <p className="rep-performance-label">Total Sales</p>
                    <p className="rep-performance-value rep-performance-blue">{totalSales}</p>
                  </div>
                  <div>
                    <p className="rep-performance-label">Total Confirmed Sales</p>
                    <p className="rep-performance-value rep-performance-blue">{totalConfirmedSales}</p>
                  </div>
                  <div>
                    <p className="rep-performance-label">Average Percentage</p>
                    <p className="rep-performance-value rep-performance-green">{avgPercentage}</p>
                  </div>
                </div>
              </div>

              {/* Bar Chart: Target vs Total Sales vs Confirmed Sales */}
              <div className="rep-performance-chart">
                <h2 className="rep-performance-section-title">Sales Performance</h2>
                <div className="rep-performance-chart-container">
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Amount' } },
                        x: { title: { display: true, text: 'Rep (Month Year)' } }
                      }
                    }}
                    ref={barChartRef}
                  />
                </div>
              </div>

              {/* Pie Chart: Performance Status */}
              <div className="rep-performance-chart">
                <h2 className="rep-performance-section-title">Performance Status Distribution</h2>
                <div className="rep-performance-chart-container">
                  <Pie
                    data={pieData}
                    options={{ responsive: true, maintainAspectRatio: false }}
                    ref={pieChartRef}
                  />
                </div>
              </div>

              {/* Detailed Table */}
              <div className="rep-performance-table">
                <h2 className="rep-performance-section-title">Performance Details</h2>
                <div className="rep-performance-table-wrapper">
                  <table className="rep-performance-table-content">
                    <thead className="rep-performance-table-header">
                      <tr>
                        <th className="rep-performance-table-header-cell">Rep ID</th>
                        <th className="rep-performance-table-header-cell">Month</th>
                        <th className="rep-performance-table-header-cell">Year</th>
                        <th className="rep-performance-table-header-cell">Target</th>
                        <th className="rep-performance-table-header-cell">Total Sales</th>
                        <th className="rep-performance-table-header-cell">Percentage</th>
                        <th className="rep-performance-table-header-cell">Confirmed Sales</th>
                        <th className="rep-performance-table-header-cell">Sales Difference</th>
                      </tr>
                    </thead>
                    <tbody className="rep-performance-table-body">
                      {data.map((item) => (
                        <tr key={`${item.repId}-${item.month}-${item.year}`}>
                          <td className="rep-performance-table-cell">{item.repId}</td>
                          <td className="rep-performance-table-cell">{item.month}</td>
                          <td className="rep-performance-table-cell">{item.year}</td>
                          <td className="rep-performance-table-cell">{item.target}</td>
                          <td className="rep-performance-table-cell">{item.totalSales}</td>
                          <td className="rep-performance-table-cell">{item.percentage}</td>
                          <td className="rep-performance-table-cell">{item.confirmedSales}</td>
                          <td className="rep-performance-table-cell">{item.salesDifference}</td>
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

export default RepPerformanceReport;
