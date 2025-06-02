// src/components/production/ViewOrderWastageModal.jsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const ViewOrderWastageModal = ({ isOpen, onClose, order }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderUsage, setOrderUsage] = useState(null);

  useEffect(() => {
    if (order && isOpen) {
      fetchOrderUsageData();
    }
  }, [order, isOpen]);
  
  const fetchOrderUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch order usage data with wastage details
      const response = await api.get(`/orders/${order._id}/usage`);
      setOrderUsage(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching order usage data:', err);
      setError('Failed to load order wastage details');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTotalMaterialRequired = (material) => {
    return (material.requiredQty || 0) + (material.wastage || 0);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Order Wastage Details - PO# {order.poNo}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Order Information</h4>
              <p className="text-sm text-gray-600 mb-1"><span className="font-medium">PO Number:</span> {order.poNo}</p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Product:</span> {order.productId?.itemName} ({order.productId?.styleNo})
              </p>
              <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Quantity:</span> {order.quantity}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Status:</span> {order.status}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-gray-500">Loading wastage data...</p>
            </div>
          ) : orderUsage ? (
            <>
              {/* Material Wastage Summary */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Material Wastage Summary</h5>
                
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Required Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Used Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Standard Wastage</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Extra Wastage</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total Wastage</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total Required</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Waste %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orderUsage.usage.map((material, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{material.materialName}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.itemCode || '-'}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.requiredQty || 0}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.unit || '-'}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.actualUsedQty || 0}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.standardWastage || 0}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.extraWastage || 0}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{material.wastage || 0}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {calculateTotalMaterialRequired(material).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {material.wastePercentage || '0'}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Wastage History Details */}
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Wastage History</h5>
                
                {orderUsage.usage.some(material => material.wastageHistory && material.wastageHistory.length > 0) ? (
                  <div className="space-y-4">
                    {orderUsage.usage.map((material, mIndex) => (
                      material.wastageHistory && material.wastageHistory.length > 0 && (
                        <div key={mIndex} className="border border-gray-200 rounded-md overflow-hidden">
                          <div className="bg-gray-50 px-3 py-2">
                            <h6 className="text-xs font-medium text-gray-700">{material.materialName} ({material.itemCode})</h6>
                          </div>
                          
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Standard Wastage</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Extra Wastage</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {material.wastageHistory.map((history, hIndex) => (
                                <tr key={hIndex} className={hIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{formatDate(history.date)}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{history.standardWastage || 0}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{history.extraWastage || 0}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{history.totalWastage || 0}</div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {history.isExtraWastageOnly ? 
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Extra Only</span> : 
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Production</span>
                                      }
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="text-sm text-gray-500">{history.wastageReason || '-'}</div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-sm">No wastage history found for this order.</p>
                  </div>
                )}
              </div>
              
              {/* Production Logs */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Production Records</h5>
                
                {orderUsage.productionLogs && orderUsage.productionLogs.length > 0 ? (
                  <div className="border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Cut Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orderUsage.productionLogs.map((log, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{formatDate(log.date)}</div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{log.cutQty}</div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {log.isExtraWastageOnly ? 
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Extra Wastage</span> : 
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Production</span>
                                }
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-sm text-gray-500">{log.remarks || '-'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-sm">No production records found for this order.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700 text-sm">No usage data found for this order.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderWastageModal;