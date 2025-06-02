import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWastageAnalysis } from '../../redux/slices/productionSlice';
import { fetchProducts } from '../../redux/slices/productsSlice';

const WastageAnalysis = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    productId: ''
  });

  const { wastageAnalysis, isLoading } = useSelector(state => state.production);
  const { products } = useSelector(state => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
    loadWastageData();
  }, [dispatch]);

  const loadWastageData = () => {
    const queryParams = { ...filters };
    if (!queryParams.productId) delete queryParams.productId;
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

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Wastage Analysis</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        <div>
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700">Product (Optional)</label>
          <select
            id="productId"
            name="productId"
            value={filters.productId}
            onChange={handleFilterChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Products</option>
            {products.map(product => (
              <option key={product._id} value={product._id}>
                {product.styleNo} - {product.itemName}
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
            {isLoading ? 'Loading...' : 'Analyze'}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extra Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Wastage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wastage %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wastageAnalysis.materialStats?.map((stat, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 text-sm text-gray-900">{stat.materialName}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{stat.totalUsed.toFixed(2)} {stat.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{stat.standardWastage.toFixed(2)} {stat.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{stat.extraWastage.toFixed(2)} {stat.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{stat.totalWastage.toFixed(2)} {stat.unit}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{stat.wastagePercentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WastageAnalysis; 