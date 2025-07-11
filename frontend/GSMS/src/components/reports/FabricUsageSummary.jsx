import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFabricUsage, exportToExcel, exportToPDF } from '../../redux/slices/reportsSlice';
import { getAllCompletedOrders } from '../../redux/slices/ordersSlice';
import { fetchMaterials } from '../../redux/slices/materialsSlice';
import ExportButtons from './ExportButtons';
import { Select, MenuItem, FormControl, InputLabel, ToggleButtonGroup, ToggleButton } from '@mui/material';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const FabricUsageSummary = () => {
  const dispatch = useDispatch();
  const [filterType, setFilterType] = useState('date'); // 'date', 'order', or 'material'
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    orderId: '',
    materialId: ''
  });

    const { fabricUsage, isLoading } = useSelector(state => state.reports);
  const { completedOrders, loading: ordersLoading, error: ordersError } = useSelector(state => state.orders);
  const { materials: allMaterials, loading: materialsLoading, error: materialsError } = useSelector(state => state.materials);
  
  const summary = fabricUsage?.summary || {};
  const materials = fabricUsage?.materials || [];

  // Fetch completed orders and materials on component mount
  useEffect(() => {
    dispatch(getAllCompletedOrders());
    dispatch(fetchMaterials());
  }, [dispatch]);

  // Load fabric usage data when filters change
  useEffect(() => {
    // Only trigger API call if we have the necessary data
    if (filterType === 'order' && !filters.orderId) return;
    if (filterType === 'material' && !filters.materialId) return;
    if (filterType === 'date' && (!filters.startDate || !filters.endDate)) return;
    
    loadFabricUsageData();
  }, [filters, filterType]);

  const loadFabricUsageData = () => {
    const queryParams = {};
    
    // Only include the relevant parameters based on filter type
    if (filterType === 'order' && filters.orderId) {
      queryParams.orderId = filters.orderId;
    } else if (filterType === 'material' && filters.materialId) {
      queryParams.materialId = filters.materialId;
    } else if (filterType === 'date') {
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;
    }
    
    if (Object.keys(queryParams).length > 0) {
      dispatch(getFabricUsage(queryParams));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Create a new filters object with the updated value
    const newFilters = {
      // Reset all filter values
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      orderId: '',
      materialId: '',
      // Set the new filter value
      [name]: value
    };
    
    setFilters(newFilters);
  };

  const handleFilterTypeChange = (event, newFilterType) => {
    if (newFilterType !== null && newFilterType !== filterType) {
      setFilterType(newFilterType);
      // Reset all filters when changing filter type
      setFilters({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        orderId: '',
        materialId: ''
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadFabricUsageData();
  };

  const handleExport = (format) => {
    // Create base params with report type
    const params = { reportType: 'fabric-usage' };
    
    // Add only the relevant parameters based on the current filter type
    if (filterType === 'date') {
      params.startDate = filters.startDate;
      params.endDate = filters.endDate;
    } else if (filterType === 'order' && filters.orderId) {
      params.orderId = filters.orderId;
    } else if (filterType === 'material' && filters.materialId) {
      params.materialId = filters.materialId;
    }
    
    // Dispatch the appropriate export action
    if (format === 'excel') {
      dispatch(exportToExcel(params));
    } else {
      dispatch(exportToPDF(params));
    }
  };

  // Function to get filtered materials based on search
  const getFilteredMaterials = () => {
    try {
      // If materials is null/undefined, return empty array
      if (!materials) return [];
      
      // Handle array of materials from the API response
      if (Array.isArray(materials)) {
        return materials.map(material => ({
          ...material,
          materialName: material.name,
          totalRequiredQty: material.totalUsage + (material.totalWastage || 0),
          totalWastage: material.totalWastage || 0,
          totalUsage: material.totalUsage || 0,
          wastagePercentage: material.wastePercentage || 0,
          orders: material.orderUsage?.map(order => ({
            ...order,
            requiredQty: order.usage,
            totalRequiredQty: order.usage + (order.wastage || 0),
            completedDate: order.date
          })) || []
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error processing materials data:', error);
      return [];
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
      
      <div className="mb-6 space-y-4">
        <div className="flex justify-center mb-4">
          <ToggleButtonGroup
            color="primary"
            value={filterType}
            exclusive
            onChange={handleFilterTypeChange}
            aria-label="filter type"
          >
            <ToggleButton value="date">Date Range</ToggleButton>
            <ToggleButton value="order">By Order</ToggleButton>
            <ToggleButton value="material">By Material</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filterType === 'date' && (
            <>
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
            </>
          )}

          {filterType === 'order' && (
            <div className="md:col-span-3">
              <FormControl fullWidth size="small">
                <InputLabel id="order-select-label">Select Order (PO No)</InputLabel>
                <Select
                  labelId="order-select-label"
                  id="orderId"
                  name="orderId"
                  value={filters.orderId}
                  onChange={handleFilterChange}
                  label="Select Order (PO No)"
                >
                  <MenuItem value="">
                    <em>Select an order</em>
                  </MenuItem>
                  {ordersLoading ? (
                    <MenuItem disabled>Loading orders...</MenuItem>
                  ) : ordersError ? (
                    <MenuItem disabled>Error loading orders</MenuItem>
                  ) : completedOrders?.length > 0 ? (
                    completedOrders.map((order) => (
                      <MenuItem key={order._id} value={order._id}>
                        {order.poNo} - {order.customerName || order.customer?.name || 'N/A'}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No completed orders found</MenuItem>
                  )}
                </Select>
              </FormControl>
            </div>
          )}

          {filterType === 'material' && (
            <div className="md:col-span-3">
              <FormControl fullWidth size="small">
                <InputLabel id="material-select-label">Select Material</InputLabel>
                <Select
                  labelId="material-select-label"
                  id="materialId"
                  name="materialId"
                  value={filters.materialId}
                  onChange={handleFilterChange}
                  label="Select Material"
                >
                  <MenuItem value="">
                    <em>Select a material</em>
                  </MenuItem>
                  {materialsLoading ? (
                    <MenuItem disabled>Loading materials...</MenuItem>
                  ) : materialsError ? (
                    <MenuItem disabled>Error loading materials</MenuItem>
                  ) : allMaterials?.length > 0 ? (
                    allMaterials.map((material) => (
                      <MenuItem key={material._id} value={material._id}>
                        {material.itemCode} - {material.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No materials found</MenuItem>
                  )}
                </Select>
              </FormControl>
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Section */}
      {fabricUsage && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Date Range</h3>
              <p className="text-xl font-semibold">
                {formatDate(summary.startDate)} - {formatDate(summary.endDate) || 'Present'}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Materials</h3>
              <p className="text-xl font-semibold">{summary.totalMaterials || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-xl font-semibold">{summary.totalOrders || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Usage</h3>
              <p className="text-xl font-semibold">{summary.totalUsage?.toFixed(2) || '0.00'} units</p>
            </div>
          </div>

          {/* Materials Table */}
          {getFilteredMaterials().map((material, index) => (
            <div key={`material-${material.materialId || index}`} className="bg-white shadow rounded-lg overflow-hidden mt-8">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {material.name || material.materialName} - {material.itemCode || 'N/A'}
                </h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Total Required:</span>{' '}
                    <span className="font-medium">{material.totalRequiredQty?.toFixed(2)} {material.unit}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Wastage:</span>{' '}
                    <span className="font-medium">{material.totalWastage?.toFixed(2)} {material.unit}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total Usage:</span>{' '}
                    <span className="font-medium">{material.totalUsage?.toFixed(2)} {material.unit}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Wastage:</span>{' '}
                    <span className="font-medium">{material.wastagePercentage || '0.00'}%</span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style No</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Wastage</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(material.orderUsage || material.orders || []).map((order, idx) => {
                      const usage = order.usage || order.requiredQty || 0;
                      const wastage = order.wastage || 0;
                      const total = usage + wastage;
                      
                      return (
                        <tr key={`${material.materialId}-order-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.poNo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.productName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.styleNo || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {usage.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {wastage.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-900">
                            {total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                            {formatDate(order.date || order.completedDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FabricUsageSummary;