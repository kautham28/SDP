import React from 'react';
import MNavbar from '../../../components/Manager/MNavbar';
import MSidebar from '../../../components/Manager/MSidebar';
import '../MSalesReports.css';

const PharmacySalesReport = () => {
  return (
    <div className="sales-reports-container min-h-screen bg-gray-50">
      <MNavbar />
      <div className="sales-reports-content flex">
        <MSidebar />
        <div className="sales-reports-main p-6 flex-1">
          <h1 className="text-3xl font-bold mb-2">Pharmacy-wise Sales Report</h1>
          <p className="text-gray-600 mb-8">Examine sales data across different pharmacy locations, including revenue and product distribution.</p>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Overview</h2>
            <p className="text-gray-600">This section will display pharmacy sales data (e.g., tables or charts showing revenue and product distribution).</p>
            {/* Placeholder for actual content */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacySalesReport;