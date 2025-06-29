import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useNotification } from '../common/Notification';

const OrderDetailsModal = ({ isOpen, onClose, onSuccess, order }) => {
  const [formData, setFormData] = useState({
    description: '',
    orderDate: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form data when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        description: order.description || '',
        orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
        quantity: order.quantity?.toString() || ''
      });
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Only include fields that have changed
      const updates = {};
      if (formData.description !== order.description) {
        updates.description = formData.description;
      }
      if (formData.orderDate && new Date(formData.orderDate).toISOString() !== new Date(order.orderDate).toISOString()) {
        updates.orderDate = formData.orderDate;
      }
      if (formData.quantity && parseInt(formData.quantity) !== order.quantity) {
        updates.quantity = parseInt(formData.quantity);
      }

      // Only make API call if there are changes
      if (Object.keys(updates).length > 0) {
        const response = await api.patch(`/orders/${order._id}`, updates);
        onSuccess(response.data);
        setIsEditing(false);
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setError(null);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Order Details - {order.poNo}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <p className="block text-sm font-medium text-gray-700">Product</p>
                    <p className="mt-1 block w-full py-2 text-gray-900">
                      {order.productId.itemName} - {order.productId.styleNo}
                    </p>
                  </div>

                  <div>
                    <p className="block text-sm font-medium text-gray-700">Status</p>
                    <p className={`mt-1 inline-flex rounded-full text-xs font-medium px-2.5 py-0.5
                      ${order.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${order.status.toLowerCase() === 'producing' ? 'bg-blue-100 text-blue-800' : ''}
                      ${order.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </p>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        {/* Only allow quantity editing if order is in PENDING status */}
                        {order.status === 'PENDING' && (
                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                              Quantity
                            </label>
                            <input
                              type="number"
                              id="quantity"
                              name="quantity"
                              value={formData.quantity}
                              onChange={handleChange}
                              min="1"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">
                            Order Date
                          </label>
                          <input
                            type="date"
                            id="orderDate"
                            name="orderDate"
                            value={formData.orderDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <p className="block text-sm font-medium text-gray-700">Quantity</p>
                        <p className="mt-1 block w-full py-2 text-gray-900">{order.quantity}</p>
                      </div>

                      <div>
                        <p className="block text-sm font-medium text-gray-700">Description</p>
                        <p className="mt-1 block w-full py-2 text-gray-900">
                          {order.description || "Not Assigned"}
                        </p>
                      </div>

                      <div>
                        <p className="block text-sm font-medium text-gray-700">Order Date</p>
                        <p className="mt-1 block w-full py-2 text-gray-900">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="block text-sm font-medium text-gray-700">Created At</p>
                        <p className="mt-1 block w-full py-2 text-gray-900">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={toggleEdit}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={toggleEdit}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Edit Order
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;