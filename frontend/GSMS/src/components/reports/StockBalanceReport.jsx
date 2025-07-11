import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStockBalance, exportToExcel, exportToPDF } from '../../redux/slices/reportsSlice';
import { fetchMaterials } from '../../redux/slices/materialsSlice';
import ExportButtons from './ExportButtons';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  TextField, 
  FormControlLabel, 
  Switch, 
  Grid, 
  Box, 
  Card, 
  CardContent, 
  Typography,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const StockBalanceReport = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    materialId: '',
    status: '',
    lowStockOnly: false,
    startDate: null,
    endDate: null
  });

  const { stockBalance: reportData, isLoading, error } = useSelector(state => state.reports);
  const { materials } = useSelector(state => state.materials);
  
  // Extract materials and summary from reportData
  const materialsData = reportData?.materials || [];
  const summary = reportData?.summary || {
    totalItems: 0,
    totalReceived: 0,
    totalIssued: 0,
    totalClosing: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inStockItems: 0,
    startDate: null,
    endDate: null,
    generatedAt: null
  };

  useEffect(() => {
    dispatch(fetchMaterials());
    loadStockBalanceData();
  }, [dispatch]);

  const loadStockBalanceData = () => {
    // Create a clean params object with only defined values
    const queryParams = { ...filters };
    
    // Convert dates to ISO strings if they exist
    if (queryParams.startDate) {
      queryParams.startDate = queryParams.startDate.toISOString().split('T')[0];
    }
    if (queryParams.endDate) {
      queryParams.endDate = queryParams.endDate.toISOString().split('T')[0];
    }
    
    // Remove empty values
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
        delete queryParams[key];
      }
    });
    
    dispatch(getStockBalance(queryParams));
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleDateChange = (name) => (date) => {
    setFilters(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadStockBalanceData();
  };

  const handleExport = (format) => {
    // Create a clean params object with only defined values
    const params = { 
      reportType: 'stock-balance',
      ...filters 
    };
    
    // Format dates if they exist (using same format as handleSubmit)
    if (params.startDate) {
      params.startDate = params.startDate.toISOString().split('T')[0];
    }
    if (params.endDate) {
      params.endDate = params.endDate.toISOString().split('T')[0];
    }
    
    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });
    
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
          disabled={isLoading}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <Grid container spacing={2}>
          {/* Material Selection */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="material-label">Material</InputLabel>
              <Select
                labelId="material-label"
                id="materialId"
                name="materialId"
                value={filters.materialId}
                onChange={handleFilterChange}
                label="Material"
              >
                <MenuItem value="">
                  <em>All Materials</em>
                </MenuItem>
                {materials?.map(material => (
                  <MenuItem key={material._id} value={material._id}>
                    {material.name} - {material.itemCode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Status Selection */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">
                  <em>All Statuses</em>
                </MenuItem>
                <MenuItem value="In Stock">In Stock</MenuItem>
                <MenuItem value="Low Stock">Low Stock</MenuItem>
                <MenuItem value="Out of Stock">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Low Stock Toggle */}
          <Grid item xs={12} sm={6} md={2} className="flex items-center">
            <FormControlLabel
              control={
                <Switch
                  checked={filters.lowStockOnly}
                  onChange={handleFilterChange}
                  name="lowStockOnly"
                  color="primary"
                />
              }
              label="Low Stock Only"
              labelPlacement="end"
            />
          </Grid>
          
          {/* Date Range */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    variant="outlined"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    variant="outlined"
                  />
                )}
                minDate={filters.startDate}
              />
            </Grid>
          </LocalizationProvider>
          
          {/* Submit Button */}
          <Grid item xs={12} sm={6} md={1} className="flex items-end">
            <button
              type="submit"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full h-10"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Apply'}
            </button>
          </Grid>
        </Grid>
      </form>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Items</Typography>
            <Typography variant="h5">{summary.totalItems}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Received</Typography>
            <Typography variant="h5">{summary.totalReceived.toFixed(3)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Issued</Typography>
            <Typography variant="h5">{summary.totalIssued.toFixed(3)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Closing Balance</Typography>
            <Typography variant="h5">{summary.totalClosing.toFixed(3)}</Typography>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Period */}
      {summary.startDate && summary.endDate && (
        <div className="mb-4 text-sm text-gray-600">
          Report Period: {format(new Date(summary.startDate), 'MMM d, yyyy')} - {format(new Date(summary.endDate), 'MMM d, yyyy')}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stock data...</p>
        </div>
      ) : Array.isArray(materialsData) && materialsData.length > 0 ? (
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-3">Current Stock Levels</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opening</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materialsData.map((material, index) => (
                    <tr key={material._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>                      
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{material.itemCode || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{material.name || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {material.openingBalance?.toFixed(3) || '0.000'}
                      </td>
                      <td className="px-4 py-4 text-sm text-green-600">
                        +{material.received?.toFixed(3) || '0.000'}
                      </td>
                      <td className="px-4 py-4 text-sm text-red-600">
                        -{material.issued?.toFixed(3) || '0.000'}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {material.closingBalance?.toFixed(3) || '0.000'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{material.unit || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          material.status === 'In Stock' ? 'bg-green-100 text-green-800' : 
                          material.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {material.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Transaction History Section */}
            <h3 className="text-md font-medium text-gray-800 mt-8 mb-3">Transaction History</h3>
            <div className="grid grid-cols-1 gap-6">
              {materialsData.map((material, index) => (
                material.transactions?.length > 0 && (
                  <div key={`history-${material._id || index}`} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{material.name || 'N/A'} - {material.itemCode || 'N/A'}</h4>
                      <div className="text-sm text-gray-500">
                        {material.transactionCount} transactions | 
                        Last: {material.lastTransaction ? format(new Date(material.lastTransaction), 'MMM d, yyyy hh:mm a') : 'N/A'}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date & Time</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {material.transactions.map((transaction, idx) => (
                            <tr key={`${material._id}-transaction-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {transaction.date ? format(new Date(transaction.date), 'MMM d, yyyy hh:mm a') : 'N/A'}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  transaction.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.type || 'N/A'}
                                </span>
                              </td>
                              <td className={`px-4 py-2 text-sm font-medium ${
                                transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'IN' ? '+' : '-'}{transaction.quantity?.toFixed(3) || '0.000'} {material.unit || ''}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {transaction.reference || 'N/A'}
                                {transaction.product && (
                                  <div className="text-xs text-gray-500">Product: {transaction.product}</div>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {transaction.remarks || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4.5L4 7m16 0l-8 4.5M4 7v9.5l8 4.5m0-14l8 4.5M4 16.5L12 21m8-4.5V7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No stock data found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default StockBalanceReport; 