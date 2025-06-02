import React, { useState } from 'react';
import WastageAnalysis from '../../components/reports/WastageAnalysis';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('wastage');
  
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Reports</h1>
      </div>
      
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('wastage')}
            className={`px-3 py-2 font-medium text-sm rounded-md ${
              activeTab === 'wastage' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Wastage Analysis
          </button>
          {/* Add more report tabs here */}
        </nav>
      </div>
      
      {activeTab === 'wastage' && <WastageAnalysis />}
      
      {/* Add more report sections here */}
    </div>
  );
};

export default ReportsPage; 