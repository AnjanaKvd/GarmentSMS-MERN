import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFabricUsage, exportToExcel, exportToPDF } from '../../redux/slices/reportsSlice';
import ExportButtons from './ExportButtons';

const FabricUsageSummary = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    orderId: ''
  });

  const { fabricUsage, isLoading } = useSelector(state => state.reports);

  useEffect(() => {
    loadFabricUsageData();
  }, [dispatch]);

  const loadFabricUsageData = () => {
    const queryParams = { ...filters };
    if (!queryParams.orderId) delete queryParams.orderId;
    dispatch(getFabricUsage(queryParams));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadFabricUsageData();
  };

  const handleExport = (format) => {
    const params = { 
      reportType: 'fabric-usage',
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
        <h2 className="text-lg font-medium text-gray-900">Fabric Usage Summary</h2>
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
      
      {fabricUsage && (
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-3">Fabric Usage Details</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waste %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fabricUsage.map((material, index) => (
                  <tr key={material.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.itemCode}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.totalUsage.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {material.totalWastage.toFixed(2)}
                      <span className="text-gray-500 text-xs ml-1">
                        (S: {material.standardWastage.toFixed(2)}, E: {material.extraWastage.toFixed(2)})
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.wastePercentage}%</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Order Usage Section */}
          <h3 className="text-md font-medium text-gray-800 mt-8 mb-3">Usage by Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fabricUsage.map((material, index) => (
              <div key={material.id || `material-${index}`} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">{material.name} - {material.itemCode}</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">PO No</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Usage</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Wastage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.orderUsage?.map((order, idx) => (
                      <tr key={`${material.id}-order-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="px-2 py-2 text-sm text-gray-900">{order.poNo}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{order.productName} ({order.styleNo})</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{order.usage.toFixed(2)} {material.unit}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{order.wastage.toFixed(2)} {material.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          
          {/* Date Usage Section */}
          <h3 className="text-md font-medium text-gray-800 mt-8 mb-3">Usage by Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fabricUsage.map((material, index) => (
              <div key={material.id || `material-date-${index}`} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">{material.name} - {material.itemCode}</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Usage</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Wastage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {material.dateUsage?.map((entry, idx) => (
                      <tr key={`${material.id}-date-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="px-2 py-2 text-sm text-gray-900">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-900">{entry.usage.toFixed(2)} {material.unit}</td>
                        <td className="px-2 py-2 text-sm text-gray-900">{entry.wastage.toFixed(2)} {material.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricUsageSummary;