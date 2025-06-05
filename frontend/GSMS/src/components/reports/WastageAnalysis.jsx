import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWastageAnalysis, exportToExcel, exportToPDF } from '../../redux/slices/reportsSlice';
import ExportButtons from './ExportButtons';

const WastageAnalysis = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { wastageAnalysis, isLoading } = useSelector(state => state.reports);

  useEffect(() => {
    loadWastageData();
  }, [dispatch]);

  const loadWastageData = () => {
    const queryParams = { ...filters };
    dispatch(getWastageAnalysis(queryParams));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadWastageData();
  };

  const handleExport = (format) => {
    const params = { 
      reportType: 'wastage-analysis',
      ...filters
    };
    
    if (format === 'excel') {
      dispatch(exportToExcel(params));
    } else {
      dispatch(exportToPDF(params));
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Wastage Analysis</h2>
        <ExportButtons 
          onExportExcel={() => handleExport('excel')} 
          onExportPDF={() => handleExport('pdf')}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </form>
      
      {wastageAnalysis && (
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-3">Material Wastage Summary</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extra Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wastage %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wastageAnalysis.map((material, index) => (
                  <tr key={material.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.itemCode}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.totalUsed.toFixed(2)} {material.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {material.standardWastage.toFixed(2)} {material.unit}
                      <div className="text-xs text-gray-500">({material.standardWastagePercentage}%)</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {material.extraWastage.toFixed(2)} {material.unit}
                      <div className="text-xs text-gray-500">({material.extraWastagePercentage}%)</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.totalWastage.toFixed(2)} {material.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.totalWastagePercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Wastage Reasons Section */}
          <h3 className="text-md font-medium text-gray-800 mt-8 mb-3">Wastage by Reason</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wastageAnalysis.map((material, index) => (
              <div key={`reasons-${material.id || index}`} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">{material.name} - {material.itemCode}</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.wastageReasons?.map((reason, idx) => (
                      <tr key={`${material.id}-reason-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="px-3 py-2 text-sm text-gray-900">{reason.reason}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {reason.amount.toFixed(2)} {material.unit}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{reason.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          Wastage Breakdown
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-4 mb-1 text-xs flex rounded bg-gray-200">
                      {material.wastageReasons?.map((reason, idx) => {
                        const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'];
                        const color = colors[idx % colors.length];
                        return (
                          <div
                            key={`bar-${material.id}-${idx}`}
                            style={{ width: `${reason.percentage}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${color}`}
                            title={`${reason.reason}: ${reason.percentage}%`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      {material.wastageReasons?.map((reason, idx) => {
                        const colors = ['text-red-600', 'text-yellow-600', 'text-green-600', 'text-blue-600', 'text-indigo-600', 'text-purple-600'];
                        const color = colors[idx % colors.length];
                        return (
                          <span key={`legend-${material.id}-${idx}`} className={color}>
                            {reason.reason.substring(0, 8)}..
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WastageAnalysis; 