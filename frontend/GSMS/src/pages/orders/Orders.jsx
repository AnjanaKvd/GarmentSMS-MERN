import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import OrderFormModal from '../../components/orders/OrderFormModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      const ordersWithUsage = await Promise.all(
        response.data.map(async (order) => {
          try {
            const usageResponse = await api.get(`/orders/${order._id}/usage`);
            return {
              ...order,
              usage: usageResponse.data.usage
            };
          } catch (err) {
            console.error(`Failed to fetch usage for order ${order._id}:`, err);
            return {
              ...order,
              usage: []
            };
          }
        })
      );
      setOrders(ordersWithUsage);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleNewOrder = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOrderSuccess = () => {
    fetchOrders();
    setSelectedOrder(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => 
    order.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productId.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productId.styleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[200px] text-lg text-gray-600">
      Loading...
    </div>
  );

  if (error) return (
    <div className="text-red-600 text-center p-8 text-lg">
      {error}
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
        <button
          onClick={handleNewOrder}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Order
        </button>
      </div>
      
      {/* Search bar */}
      <div className="mb-6 max-w-lg">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  <React.Fragment key={order._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.poNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productId.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.productId.styleNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`rounded-full text-xs font-medium px-2.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                            ${order.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PRODUCING">Producing</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => toggleExpand(order._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Usage Details"
                        >
                          {expandedOrderId === order._id ? (
                            <ChevronDownIcon className="h-5 w-5" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedOrderId === order._id && (
                      <tr>
                        <td colSpan={7} className="px-8 pb-6 pt-0">
                          <div className="bg-gray-50 rounded-lg p-6 mt-2 mb-2 shadow-inner">
                            <h3 className="text-md font-semibold text-gray-800 mb-4">Material Usage Details</h3>
                            {(!order.usage || order.usage.length === 0) ? (
                              <div className="text-gray-500 text-sm">No usage details available for this order.</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-[400px] border border-gray-200 rounded">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Material Name</th>
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Item Code</th>
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Required Qty</th>
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Used Qty</th>
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Wastage</th>
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Waste %</th>
                                      <th className="px-2 py-1 text-xs font-semibold text-gray-600">Unit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.usage.map((material, idx) => (
                                      <tr key={material.materialId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.materialName}</td>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.itemCode}</td>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.requiredQty}</td>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.actualUsedQty}</td>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.wastage}</td>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.wastePercentage}</td>
                                        <td className="px-2 py-1 text-xs text-gray-700">{material.unit}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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

      {/* Order Form Modal */}
      <OrderFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleOrderSuccess}
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders; 