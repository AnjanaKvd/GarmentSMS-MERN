import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, ArrowPathIcon, PlusIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import AddOrderWastageModal from '../../components/production/AddOrderWastageModal';
import AddProductWastageModal from '../../components/production/AddProductWastageModal';
import ViewProductWastageModal from '../../components/production/ViewProductWastageModal';
import ViewOrderWastageModal from '../../components/production/ViewOrderWastageModal';
import { fetchProducts } from '../../redux/slices/productsSlice';
import { Tab } from '@headlessui/react';

const Production = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isOrderWastageModalOpen, setIsOrderWastageModalOpen] = useState(false);
  const [isProductWastageModalOpen, setIsProductWastageModalOpen] = useState(false);
  const [isViewProductWastageModalOpen, setIsViewProductWastageModalOpen] = useState(false);
  const [isViewOrderWastageModalOpen, setIsViewOrderWastageModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productionLogs, setProductionLogs] = useState([]);
  const { products } = useSelector(state => state.products);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setLoading(false);
      setOrders([]);
    }
  };

  // Fetch production logs for an order
  const fetchProductionLogs = async (orderId) => {
    try {
      const response = await api.get(`/production/order/${orderId}`);
      setProductionLogs(response.data || []);
    } catch (err) {
      console.error('Failed to fetch production logs:', err);
      setProductionLogs([]);
    }
  };

  // Fetch product wastage
  const fetchProductWastage = async (productId) => {
    try {
      const response = await api.get(`/products/${productId}/wastage`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch product wastage:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
    dispatch(fetchProducts());
  }, [dispatch]);

  const toggleExpand = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      fetchProductionLogs(orderId);
    }
  };

  const handleAddOrderWastage = (order) => {
    setSelectedOrder(order);
    setIsOrderWastageModalOpen(true);
  };

  const handleAddProductWastage = (product) => {
    setSelectedProduct(product);
    setIsProductWastageModalOpen(true);
  };

  const handleViewProductWastage = (product) => {
    setSelectedProduct(product);
    setIsViewProductWastageModalOpen(true);
  };

  const handleViewOrderWastage = (order) => {
    setSelectedOrder(order);
    setIsViewOrderWastageModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setIsOrderWastageModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseProductModal = () => {
    setIsProductWastageModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseViewProductModal = () => {
    setIsViewProductWastageModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseViewOrderModal = () => {
    setIsViewOrderWastageModalOpen(false);
    setSelectedOrder(null);
  };

  const handleWastageSuccess = () => {
    fetchOrders();
    dispatch(fetchProducts());
    if (expandedOrderId) {
      fetchProductionLogs(expandedOrderId);
    }
    setIsOrderWastageModalOpen(false);
    setIsProductWastageModalOpen(false);
    setIsViewProductWastageModalOpen(false);
    setIsViewOrderWastageModalOpen(false);
    setSelectedOrder(null);
    setSelectedProduct(null);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const poNoMatch = order.poNo && 
      order.poNo.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    const itemNameMatch = order.productId && 
      order.productId.itemName && 
      order.productId.itemName.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    const styleNoMatch = order.productId && 
      order.productId.styleNo && 
      order.productId.styleNo.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    const statusMatch = order.status && 
      order.status.toLowerCase().includes(orderSearchTerm.toLowerCase());
    
    return poNoMatch || itemNameMatch || styleNoMatch || statusMatch;
  });

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    if (!product) return false;
    
    const itemNameMatch = product.itemName && 
      product.itemName.toLowerCase().includes(productSearchTerm.toLowerCase());
    
    const styleNoMatch = product.styleNo && 
      product.styleNo.toLowerCase().includes(productSearchTerm.toLowerCase());
    
    return itemNameMatch || styleNoMatch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[200px] text-lg text-gray-600">
      Loading...
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Production Management</h1>
        <button
          onClick={() => {
            fetchOrders();
            dispatch(fetchProducts());
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-xl mb-6">
          <Tab className={({ selected }) => `w-full py-2.5 text-sm font-medium rounded-lg
            ${selected ? 'bg-white shadow text-indigo-700' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'}`}>
            Products
          </Tab>
          <Tab className={({ selected }) => `w-full py-2.5 text-sm font-medium rounded-lg
            ${selected ? 'bg-white shadow text-indigo-700' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'}`}>
            Orders
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          {/* Products Panel */}
          <Tab.Panel>
            <div className="mb-6 flex justify-between items-center">
              <div className="relative max-w-lg flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by product name or style no..."
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materials</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Std Wastage Set</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        // Check if wastage is set for any material
                        const hasWastageSet = product.materialsRequired && 
                          product.materialsRequired.some(m => m.expectedWastagePercentage > 0);
                        
                        return (
                          <tr key={product._id || product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.styleNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.itemName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.materialsRequired?.length || 0} materials
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hasWastageSet ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleAddProductWastage(product)}
                                  className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                >
                                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                                  {hasWastageSet ? 'Update Wastage' : 'Set Wastage'}
                                </button>
                                
                                {hasWastageSet && (
                                  <button
                                    onClick={() => handleViewProductWastage(product)}
                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    View Wastage
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
          
          {/* Orders Panel */}
          <Tab.Panel>
            <div className="mb-6 flex justify-between items-center">
              <div className="relative max-w-lg flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by PO No, product name, style no, or status..."
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Style No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <React.Fragment key={order._id || order.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.poNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.productId?.itemName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.productId?.styleNo || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${order.status === 'PRODUCING' ? 'bg-blue-100 text-blue-800' : ''}
                                ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                              `}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleAddOrderWastage(order)}
                                  className="font-medium text-indigo-600 hover:text-indigo-900"
                                >
                                  Add Extra Wastage
                                </button>
                                <button
                                  onClick={() => handleViewOrderWastage(order)}
                                  className="font-medium text-blue-600 hover:text-blue-900"
                                >
                                  View Wastage
                                </button>
                                <button
                                  onClick={() => toggleExpand(order._id || order.id)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  {expandedOrderId === (order._id || order.id) ? (
                                    <ChevronDownIcon className="h-5 w-5" />
                                  ) : (
                                    <ChevronRightIcon className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedOrderId === (order._id || order.id) && (
                            <tr>
                              <td colSpan={7} className="px-8 pb-6 pt-0">
                                <div className="bg-gray-50 rounded-lg p-6 mt-2 mb-2 shadow-inner">
                                  <h3 className="text-md font-semibold text-gray-800 mb-4">Wastage History</h3>
                                  
                                  {productionLogs.length === 0 ? (
                                    <div className="text-gray-500 text-sm">No wastage records for this order.</div>
                                  ) : (
                                    <div className="space-y-6">
                                      {productionLogs.map((log) => (
                                        <div key={log._id || log.id} className="bg-white p-4 rounded-lg shadow-sm">
                                          <div className="flex justify-between mb-3">
                                            <h4 className="text-sm font-medium text-gray-900">Entry Date: {formatDate(log.date)}</h4>
                                            <span className="text-sm text-gray-500">
                                              {log.isExtraWastageOnly ? 'Extra Wastage Entry' : `Cut Quantity: ${log.cutQty}`}
                                            </span>
                                          </div>
                                          
                                          <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Material Usage:</h5>
                                            <table className="min-w-full divide-y divide-gray-200">
                                              <thead className="bg-gray-50">
                                                <tr>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Used Qty</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Std Wastage</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Extra Wastage</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total Wastage</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Waste %</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-200">
                                                {log.materialUsage && log.materialUsage.map((usage, idx) => (
                                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-3 py-2 text-xs text-gray-900">
                                                      {usage.materialName || (typeof usage.materialId === 'object' ? usage.materialId.name : usage.materialId) || 'Unknown'}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">{usage.usedQty || 'N/A'}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">{usage.standardWastage || 0}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900 font-medium text-red-600">{usage.extraWastage || 0}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">
                                                      {((usage.standardWastage || 0) + (usage.extraWastage || 0)).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">
                                                      {usage.usedQty ? (((usage.standardWastage || 0) + (usage.extraWastage || 0)) / usage.usedQty * 100).toFixed(2) : 'N/A'}%
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">{usage.wastageReason || '-'}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                          
                                          {log.remarks && (
                                            <div className="mt-3">
                                              <h5 className="text-sm font-medium text-gray-700">Remarks:</h5>
                                              <p className="text-sm text-gray-600">{log.remarks}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Add Order Wastage Modal */}
      <AddOrderWastageModal
        isOpen={isOrderWastageModalOpen}
        onClose={handleCloseOrderModal}
        onSuccess={handleWastageSuccess}
        order={selectedOrder}
      />

      {/* Add Product Wastage Modal */}
      <AddProductWastageModal
        isOpen={isProductWastageModalOpen}
        onClose={handleCloseProductModal}
        onSuccess={handleWastageSuccess}
        product={selectedProduct}
      />
      
      {/* View Product Wastage Modal */}
      <ViewProductWastageModal
        isOpen={isViewProductWastageModalOpen}
        onClose={handleCloseViewProductModal}
        product={selectedProduct}
      />

      {/* View Order Wastage Modal */}
      <ViewOrderWastageModal
        isOpen={isViewOrderWastageModalOpen}
        onClose={handleCloseViewOrderModal}
        order={selectedOrder}
      />
    </div>
  );
};

export default Production;
