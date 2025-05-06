import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MNavbar from '../../components/Manager/MNavbar';
import MSidebar from '../../components/Manager/MSidebar';
import { Package, ShoppingCart, Users, BarChart, Calendar } from 'lucide-react';
import './MSalesReports.css';

const MSalesReports = () => {
  const [reportType, setReportType] = useState('');
  const navigate = useNavigate();

  // Define report data for cards
  const reportCards = [
    {
      id: 'inventory',
      title: 'Inventory Status Report',
      description: 'Get detailed information about current stock levels, item availability, and inventory valuations.',
      icon: <Package className="h-8 w-8 text-gray-500" />,
      path: '/manager/sales-reports/inventory',
    },
    {
      id: 'orders',
      title: 'Order Summary Report',
      description: 'View comprehensive summaries of orders including order volumes, values, and fulfillment status.',
      icon: <ShoppingCart className="h-8 w-8 text-gray-500" />,
      path: '/manager/sales-reports/orders',
    },
    {
      id: 'repPerformance',
      title: 'Rep Performance Report',
      description: 'Analyze sales representative performance including targets, achievements, and sales metrics.',
      icon: <Users className="h-8 w-8 text-gray-500" />,
      path: '/manager/sales-reports/rep-performance',
    },
    {
      id: 'pharmacySales',
      title: 'Pharmacy-wise Sales Report',
      description: 'Examine sales data across different pharmacy locations, including revenue and product distribution.',
      icon: <BarChart className="h-8 w-8 text-gray-500" />,
      path: '/manager/sales-reports/pharmacy-sales',
    },
    {
      id: 'expiry',
      title: 'Expiry Goods Report',
      description: 'Track products approaching expiration dates to manage inventory and reduce waste effectively.',
      icon: <Calendar className="h-8 w-8 text-gray-500" />,
      path: '/manager/sales-reports/expiry',
    },
  ];

  const handleCardClick = (id, path) => {
    setReportType(id);
    navigate(path);
  };

  return (
    <div className="sales-reports-container min-h-screen bg-gray-50">
      <MNavbar />
      <div className="sales-reports-content flex">
        <MSidebar />
        <div className="sales-reports-main p-6 flex-1">
          <h1 className="text-3xl font-bold mb-2">Report Generation</h1>
          <p className="text-gray-600 mb-8">Select a report type to generate detailed business insights.</p>

          {/* Report Cards Grid */}
          <div className="report-cards-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            {reportCards.map((report) => (
              <div
                key={report.id}
                onClick={() => handleCardClick(report.id, report.path)}
                className={`report-card p-6 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${
                  reportType === report.id ? 'border-blue-600 border-2' : 'border border-gray-200'
                } hover:border-blue-600 hover:shadow-md bg-white`}
              >
                <div className="flex items-center gap-4">
                  {report.icon}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{report.title}</h2>
                    <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSalesReports;