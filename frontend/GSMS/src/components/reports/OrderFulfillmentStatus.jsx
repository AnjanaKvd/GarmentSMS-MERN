import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderFulfillment, exportToExcel, exportToPDF } from '../../redux/slices/reportsSlice';
import ExportButtons from './ExportButtons';

const OrderFulfillmentStatus = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    status: ''
  });

  const { orderFulfillment, isLoading } = useSelector(state => state.reports);

  useEffect(() => {
    loadOrderFulfillmentData();
  }, [dispatch]);

  const loadOrderFulfillmentData = () => {
    const queryParams = { ...filters };
    if (!queryParams.status) delete queryParams.status;
    dispatch(getOrderFulfillment(queryParams));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadOrderFulfillmentData();
  };

  const handleExport = (format) => {
    const params = { 
      reportType: 'order-fulfillment',
      ...filters
    };
    
    if (format === 'excel') {
      dispatch(exportToExcel(params));
    } else {
      dispatch(exportToPDF(params));
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PRODUCING': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Order Fulfillment Status</h2>
        <ExportButtons 
          onExportExcel={() => handleExport('excel')} 
          onExportPDF={() => handleExport('pdf')}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status Filter (Optional)</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PRODUCING">Producing</option>
            <option value="COMPLETED">Completed</option>
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
      
      {orderFulfillment && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderFulfillment.map((order, index) => (
                <tr key={order.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{order.poNo}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {order.product.styleNo} - {order.product.itemName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${order.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{order.completionPercentage}% Complete</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {order.materialStatus?.map((material, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="font-medium">{material.name}:</span>
                          <span>
                            {material.used.toFixed(2)}/{material.required.toFixed(2)} {material.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                    {order.daysSinceCreation > 30 && (
                      <div className="mt-2 text-xs text-red-500">
                        Order is {order.daysSinceCreation} days old
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderFulfillmentStatus; 