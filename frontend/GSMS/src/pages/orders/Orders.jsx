import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon, EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import OrderFormModal from '../../components/orders/OrderFormModal';
import DeleteOrderModal from '../../components/orders/DeleteOrderModal';
import OrderDetailsModal from '../../components/orders/OrderDetailsModal';
import AddOrderWastageModal from '../../components/production/AddOrderWastageModal';
import ViewOrderWastageModal from '../../components/production/ViewOrderWastageModal';
import { getUserFromToken } from '../../redux/slices/authSlice';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user from Redux state
  const { token } = useSelector((state) => state.auth);
  const user = getUserFromToken(token);
  
  // Define role-based permissions
  const canAddOrders = ['ADMIN', 'MANAGER'].includes(user?.role);
  const canEditOrders = ['ADMIN', 'MANAGER'].includes(user?.role);
  const canDeleteOrders = ['ADMIN'].includes(user?.role);
  const canUpdateStatus = ['ADMIN', 'MANAGER', 'PRODUCTION'].includes(user?.role);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [insufficientStockError, setInsufficientStockError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState(null);
  const [showAddWastageModal, setShowAddWastageModal] = useState(false);
  const [showViewWastageModal, setShowViewWastageModal] = useState(false);

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

  // Set initial expanded state based on order status
  useEffect(() => {
    if (orders.length > 0) {
      const initiallyExpanded = orders
        .filter(order => ['PENDING', 'PRODUCING'].includes(order.status))
        .map(order => order._id);
      setExpandedOrders(initiallyExpanded);
    }
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setError(null);
      setInsufficientStockError(null);
      // Find the current order
      const currentOrder = orders.find(order => order._id === orderId);
      
      // Validate status transition
      if (currentOrder.status === 'PENDING' && newStatus === 'COMPLETED') {
        setError('Cannot change status from PENDING to COMPLETED directly. Must go through PRODUCING first.');
        return;
      }

      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      if (err.response?.data?.insufficientMaterials) {
        setInsufficientStockError({
          message: err.response.data.message,
          materials: err.response.data.insufficientMaterials
        });
      } else {
        setError(err.response?.data?.message || 'Failed to update order status');
      }
    }
  };

  const getAvailableStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return ['PENDING', 'PRODUCING'];
      case 'PRODUCING':
        return ['PRODUCING', 'COMPLETED'];
      case 'COMPLETED':
        return ['COMPLETED'];
      default:
        return [currentStatus];
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

  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (response) => {
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
    fetchOrders();
    setDeleteSuccessMessage(response.message || 'Order deleted successfully');
    setTimeout(() => {
      setDeleteSuccessMessage(null);
    }, 5000);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
  };

  // New handlers for order details modal
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleOrderUpdateSuccess = (updatedOrder) => {
    fetchOrders();
    setUpdateSuccessMessage('Order updated successfully');
    setTimeout(() => {
      setUpdateSuccessMessage(null);
    }, 5000);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleAddWastageClick = (order, e) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedOrder(order);
    setShowAddWastageModal(true);
  };

  const handleViewWastageClick = (order, e) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedOrder(order);
    setShowViewWastageModal(true);
  };

  const handleWastageSuccess = () => {
    setShowAddWastageModal(false);
    setShowViewWastageModal(false);
    fetchOrders(); // Refresh orders to show updated wastage data
  };

  const filteredOrders = orders.filter(order => 
    order.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productId.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productId.styleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (orderId, e) => {
    if (e) e.stopPropagation();
    setExpandedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId) // Remove if exists (collapse)
        : [...prev, orderId] // Add if not exists (expand)
    );
  };

  const isExpanded = (orderId) => {
    return expandedOrders.includes(orderId);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[200px] text-lg text-gray-600">
      Loading...
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
        {canAddOrders && (
          <button
            onClick={handleNewOrder}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Create new order"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Order
          </button>
        )}
      </div>
      
      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {insufficientStockError && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 font-medium mb-2">{insufficientStockError.message}</p>
          <ul className="list-disc list-inside text-yellow-700">
            {insufficientStockError.materials.map((material, index) => (
              <li key={index}>
                {material.materialName}: Required {material.requiredQty}, Available {material.currentStock}, Need {material.requiredQty - material.currentStock}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Success Messages */}
      {deleteSuccessMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{deleteSuccessMessage}</p>
        </div>
      )}

      {updateSuccessMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{updateSuccessMessage}</p>
        </div>
      )}
      
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wastage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                        isExpanded(order._id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={(e) => {
                        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
                          canEditOrders && handleViewOrderDetails(order);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{order.poNo}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.productId.itemName}</div>
                        <div className="text-sm text-gray-500">{order.productId.styleNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canUpdateStatus ? (
                          <select
                            value={order.status}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent row click event
                              handleStatusChange(order._id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent row click event
                            className={`rounded-full text-xs font-medium px-2.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                              ${order.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status.toLowerCase() === 'producing' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            `}
                            title="Change order status"
                          >
                            {getAvailableStatuses(order.status).map(status => (
                              <option key={status} value={status}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex rounded-full text-xs font-medium px-2.5 py-0.5
                            ${order.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.status.toLowerCase() === 'producing' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          `}>
                            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={(e) => handleViewWastageClick(order, e)}
                            className="flex items-center text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200 text-sm"
                            title="View Wastage Details"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            <span>Wastage</span>
                          </button>
                          {canUpdateStatus && (
                            <button
                              onClick={(e) => handleAddWastageClick(order, e)}
                              className="flex items-center text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50 transition-colors duration-200 text-sm"
                              title="Update Wastage"
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" />
                              <span>Wastage</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(order._id, e);
                            }}
                            className="flex items-center text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors duration-200 text-sm focus:outline-none"
                            title={isExpanded(order._id) ? 'Collapse Usage Details' : 'View Usage Details'}
                          >
                            {isExpanded(order._id) ? (
                              <>
                                <ChevronDownIcon className="h-4 w-4 mr-1 text-indigo-700" />
                                <span>Usage</span>
                              </>
                            ) : (
                              <>
                                <ChevronRightIcon className="h-4 w-4 mr-1 text-indigo-600" />
                                <span>Usage</span>
                              </>
                            )}
                          </button>
                          
                          {canEditOrders && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(order._id, e);
                                setSelectedOrder(order);
                                setIsModalOpen(true);
                              }}
                              className="flex items-center text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors duration-200 text-sm"
                              title="Edit Order Details"
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1" />
                              <span>Edit</span>
                            </button>
                          )}
                          
                          {canDeleteOrders && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(order);
                              }}
                              className="flex items-center text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors duration-200 text-sm"
                              title="Delete This Order"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded(order._id) && (
                      <tr onClick={(e) => e.stopPropagation()}>
                        <td colSpan={8} className="px-8 pb-6 pt-0">
                          <div className="bg-gray-50 rounded-lg p-6 mt-2 mb-2 shadow-inner border-l-4 border-indigo-500">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-md font-semibold text-gray-800">Material Usage Details</h3>
                              <div className="flex space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'PRODUCING' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                                </span>
                              </div>
                            </div>
                            {(!order.usage || order.usage.length === 0) ? (
                              <div className="text-gray-500 text-sm">No usage details available for this order.</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                                  <thead className="bg-gray-800 text-white">
                                    <tr>
                                      <th className="px-4 py-2 text-xs font-semibold text-left">Material Name</th>
                                      <th className="px-4 py-2 text-xs font-semibold text-left">Material Code</th>
                                      <th className="px-4 py-2 text-xs font-semibold text-right">Standard Required</th>
                                      <th className="px-4 py-2 text-xs font-semibold text-right">Product Wastage</th>
                                      <th className="px-4 py-2 text-xs font-semibold text-right">Order Wastage</th>
                                      <th className="px-4 py-2 text-xs font-semibold text-right">Total Wastage</th>
                                      <th className="px-4 py-2 text-xs font-semibold text-right">Total Required</th>
                                      {order.status === 'PENDING' && (
                                        <th className="px-4 py-2 text-xs font-semibold text-right">Current Stock</th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.usage.map((material, idx) => (
                                      <tr key={material.materialId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}>
                                        <td className="px-4 py-2 text-xs text-gray-700 font-medium">{material.materialName}</td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{material.itemCode}</td>
                                        <td className="px-4 py-2 text-xs text-gray-700 text-right">{material.requiredQty} <span className="text-gray-500">{material.unit}</span></td>
                                        <td className="px-4 py-2 text-xs text-amber-700 text-right">{material.standardWastage || 0} <span className="text-gray-500">{material.unit}</span></td>
                                        <td className="px-4 py-2 text-xs text-orange-700 text-right">{material.extraWastage || 0} <span className="text-gray-500">{material.unit}</span></td>
                                        <td className="px-4 py-2 text-xs font-medium text-right">
                                          <span className="text-red-700">
                                            {((material.standardWastage || 0) + (material.extraWastage || 0))} <span className="text-gray-500">{material.unit}</span>
                                          </span>
                                          <span className="text-gray-500 text-xs ml-1">
                                            ({material.wastePercentage || ((material.standardWastage || 0) + (material.extraWastage || 0)) > 0 ?
                                            `${((((material.standardWastage || 0) + (material.extraWastage || 0)) / (material.actualUsedQty || material.requiredQty)) * 100).toFixed(2)}%` :
                                            '0.00%'})
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-xs font-bold text-blue-700 text-right">
                                          {material.totalRequiredQty} <span className="text-gray-500">{material.unit}</span>
                                        </td>
                                        {order.status === 'PENDING' && (
                                          <td
                                            className="px-4 py-2 text-right"
                                          >
                                            <div className="flex flex-col items-end">
                                              <span className={`text-sm font-bold ${
                                                material.currentStock < material.requiredQty
                                                ? 'text-red-600'
                                                : (material.totalRequiredQty / material.currentStock) * 100 > 80
                                                ? 'text-yellow-600'
                                                : 'text-green-600'
                                              }`}>
                                                {material.currentStock} <span className="text-gray-500">{material.unit}</span>
                                              </span>
                                              <span className={`text-xs ${
                                                (material.currentStock - material.totalRequiredQty) < 0 
                                                ? 'text-red-600 font-medium' 
                                                : 'text-gray-600'
                                              }`}>
                                                ({material.currentStock - material.totalRequiredQty} <span className="text-gray-500">{material.unit} available</span>)
                                              </span>
                                            </div>
                                          </td>
                                        )}
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

      {/* Delete Order Modal */}
      <DeleteOrderModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onSuccess={handleDeleteSuccess}
        order={selectedOrder}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        order={selectedOrder}
        onSuccess={handleOrderUpdateSuccess}
      />

      {/* Add/Edit Order Wastage Modal */}
      {selectedOrder && (
        <>
          <AddOrderWastageModal
            isOpen={showAddWastageModal}
            onClose={() => setShowAddWastageModal(false)}
            onSuccess={handleWastageSuccess}
            order={selectedOrder}
          />
          
          <ViewOrderWastageModal
            isOpen={showViewWastageModal}
            onClose={() => setShowViewWastageModal(false)}
            order={selectedOrder}
          />
        </>
      )}
    </div>
  );
};

export default Orders;