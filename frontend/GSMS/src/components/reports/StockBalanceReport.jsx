import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStockBalance, exportToExcel, exportToPDF } from '../../redux/slices/reportsSlice';
import { fetchMaterials } from '../../redux/slices/materialsSlice';
import ExportButtons from './ExportButtons';

const StockBalanceReport = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    materialId: ''
  });

  const { stockBalance, isLoading } = useSelector(state => state.reports);
  const { materials } = useSelector(state => state.materials);

  useEffect(() => {
    dispatch(fetchMaterials());
    loadStockBalanceData();
  }, [dispatch]);

  const loadStockBalanceData = () => {
    const queryParams = { ...filters };
    if (!queryParams.materialId) delete queryParams.materialId;
    dispatch(getStockBalance(queryParams));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadStockBalanceData();
  };

  const handleExport = (format) => {
    const params = { 
      reportType: 'stock-balance',
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
        <h2 className="text-lg font-medium text-gray-900">In-Out Stock Balance Report</h2>
        <ExportButtons 
          onExportExcel={() => handleExport('excel')} 
          onExportPDF={() => handleExport('pdf')}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="materialId" className="block text-sm font-medium text-gray-700">Material (Optional)</label>
          <select
            id="materialId"
            name="materialId"
            value={filters.materialId}
            onChange={handleFilterChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Materials</option>
            {materials?.map(material => (
              <option key={material._id} value={material._id}>
                {material.name} - {material.itemCode}
              </option>
            ))}
          </select>
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
      
      {stockBalance && (
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-3">Current Stock Levels</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Received</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockBalance.map((material, index) => (
                  <tr key={material.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.itemCode}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {material.currentBalance.toFixed(2)} {material.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {material.totalReceived.toFixed(2)} {material.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {material.totalUsed.toFixed(2)} {material.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{material.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {new Date(material.lastUpdated).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Transaction History Section */}
          <h3 className="text-md font-medium text-gray-800 mt-8 mb-3">Transaction History</h3>
          <div className="grid grid-cols-1 gap-6">
            {stockBalance.map((material, index) => (
              <div key={`history-${material.id || index}`} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">{material.name} - {material.itemCode}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Balance</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {material.history?.map((transaction, idx) => (
                        <tr key={`${material.id}-transaction-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {transaction.quantity.toFixed(2)} {material.unit}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {transaction.balance.toFixed(2)} {material.unit}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {transaction.remarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockBalanceReport; 