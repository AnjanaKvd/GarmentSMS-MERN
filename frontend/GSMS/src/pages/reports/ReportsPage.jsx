import React, { useState } from 'react';
import FabricUsageSummary from '../../components/reports/FabricUsageSummary';
import StockBalanceReport from '../../components/reports/StockBalanceReport';
import OrderFulfillmentStatus from '../../components/reports/OrderFulfillmentStatus';
import WastageAnalysis from '../../components/reports/WastageAnalysis';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('fabricUsage');
  
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
          <button
            onClick={() => setActiveTab('fabricUsage')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              activeTab === 'fabricUsage' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Fabric Usage Summary
          </button>
          <button
            onClick={() => setActiveTab('stockBalance')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              activeTab === 'stockBalance' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            In-Out Stock Balance
          </button>
          <button
            onClick={() => setActiveTab('orderFulfillment')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              activeTab === 'orderFulfillment' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Order Fulfillment Status
          </button>
          <button
            onClick={() => setActiveTab('wastageAnalysis')}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              activeTab === 'wastageAnalysis' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Wastage Analysis
          </button>
        </nav>
      </div>
      
      {activeTab === 'fabricUsage' && <FabricUsageSummary />}
      {activeTab === 'stockBalance' && <StockBalanceReport />}
      {activeTab === 'orderFulfillment' && <OrderFulfillmentStatus />}
      {activeTab === 'wastageAnalysis' && <WastageAnalysis />}
    </div>
  );
};

export default ReportsPage; 