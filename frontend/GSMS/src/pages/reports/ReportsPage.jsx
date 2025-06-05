import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import FabricUsageSummary from '../../components/reports/FabricUsageSummary';
import StockBalanceReport from '../../components/reports/StockBalanceReport';
import OrderFulfillmentStatus from '../../components/reports/OrderFulfillmentStatus';
import WastageAnalysis from '../../components/reports/WastageAnalysis';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('fabricUsage');
  const { user } = useSelector((state) => state.auth);
  
  // Define role-based permissions
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isProduction = user?.role === 'PRODUCTION';
  const isViewer = user?.role === 'VIEWER';
  
  // Define which roles can access which reports
  const canViewFabricUsage = isAdmin || isManager || isProduction || isViewer; // All roles
  const canViewStockBalance = isAdmin || isManager || isProduction; // Admin, Manager, Production
  const canViewOrderFulfillment = isAdmin || isManager; // Admin, Manager
  const canViewWastageAnalysis = isAdmin || isManager; // Admin, Manager
  
  // Set initial active tab based on permissions
  useEffect(() => {
    // If user can't view the current active tab, find the first accessible tab
    if (
      (activeTab === 'fabricUsage' && !canViewFabricUsage) ||
      (activeTab === 'stockBalance' && !canViewStockBalance) ||
      (activeTab === 'orderFulfillment' && !canViewOrderFulfillment) ||
      (activeTab === 'wastageAnalysis' && !canViewWastageAnalysis)
    ) {
      if (canViewFabricUsage) {
        setActiveTab('fabricUsage');
      } else if (canViewStockBalance) {
        setActiveTab('stockBalance');
      } else if (canViewOrderFulfillment) {
        setActiveTab('orderFulfillment');
      } else if (canViewWastageAnalysis) {
        setActiveTab('wastageAnalysis');
      }
    }
  }, [canViewFabricUsage, canViewStockBalance, canViewOrderFulfillment, canViewWastageAnalysis]);
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Exports Module</h1>
        <p className="text-sm text-gray-600 mt-1">
          Generate detailed reports and export data to Excel or PDF
        </p>
      </div>
      
      <div className="mb-6">
        <nav className="flex flex-wrap gap-2">
          {canViewFabricUsage && (
            <button
              onClick={() => setActiveTab('fabricUsage')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'fabricUsage' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
              title="View fabric usage summary report"
            >
              Fabric Usage Summary
            </button>
          )}
          {canViewStockBalance && (
            <button
              onClick={() => setActiveTab('stockBalance')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'stockBalance' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
              title="View in-out stock balance report"
            >
              In-Out Stock Balance
            </button>
          )}
          {canViewOrderFulfillment && (
            <button
              onClick={() => setActiveTab('orderFulfillment')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'orderFulfillment' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
              title="View order fulfillment status report"
            >
              Order Fulfillment Status
            </button>
          )}
          {canViewWastageAnalysis && (
            <button
              onClick={() => setActiveTab('wastageAnalysis')}
              className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'wastageAnalysis' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
              title="View wastage analysis report"
            >
              Wastage Analysis
            </button>
          )}
        </nav>
      </div>
      
      {activeTab === 'fabricUsage' && canViewFabricUsage && <FabricUsageSummary />}
      {activeTab === 'stockBalance' && canViewStockBalance && <StockBalanceReport />}
      {activeTab === 'orderFulfillment' && canViewOrderFulfillment && <OrderFulfillmentStatus />}
      {activeTab === 'wastageAnalysis' && canViewWastageAnalysis && <WastageAnalysis />}
      
      {/* Display message if user doesn't have permission to view any reports */}
      {!canViewFabricUsage && !canViewStockBalance && !canViewOrderFulfillment && !canViewWastageAnalysis && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have permission to view any reports. Please contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Display message if selected report is not accessible */}
      {((activeTab === 'fabricUsage' && !canViewFabricUsage) ||
        (activeTab === 'stockBalance' && !canViewStockBalance) ||
        (activeTab === 'orderFulfillment' && !canViewOrderFulfillment) ||
        (activeTab === 'wastageAnalysis' && !canViewWastageAnalysis)) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have permission to view this report. Please select another report or contact your administrator for access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;