// src/components/production/AddOrderWastageModal.jsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const AddOrderWastageModal = ({ isOpen, onClose, onSuccess, order }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    materialUsage: [],
    remarks: ''
  });
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

      // Fetch order usage data to get materials list
      const response = await api.get(`/orders/${order._id}/usage`);
      const usage = response.data.usage || [];
      setOrderUsage(response.data);

      setFormData({
        materialUsage: usage.map(material => {
          // Calculate current extra wastage from wastageHistory
          const currentExtraWastage = material.wastageHistory?.reduce((sum, log) => {
            return sum + (log.extraWastage || 0);
          }, 0) || 0;
          
          return {
            materialId: material.materialId,
            materialName: material.materialName,
            itemCode: material.itemCode,
            requiredQty: material.requiredQty || 0,
            unit: material.unit, 
            standardWastage: material.standardWastage || 0,
            extraWastage: currentExtraWastage,
            totalWastage: (material.standardWastage || 0) + currentExtraWastage,
            wastageReason: ''
          };
        }),
        remarks: ''
      });

      setLoading(false);
    } catch (err) {
      setError('Failed to load order materials');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.materialUsage];
    const material = updatedMaterials[index];

    if (field === 'extraWastage') {
      const extraWastage = parseFloat(value) || 0;
      updatedMaterials[index] = {
        ...material,
        extraWastage,
        totalWastage: (material.standardWastage || 0) + extraWastage
      };
    } else {
      updatedMaterials[index] = {
        ...material,
        [field]: value
      };
    }

    setFormData({ ...formData, materialUsage: updatedMaterials });
  };

  const calculateTotalMaterialRequired = (material) => {
    return (material.requiredQty || 0) + (material.totalWastage || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format the data to match the API expectations
      const wastageData = {
        orderId: order._id,
        materialUsage: formData.materialUsage
          .filter(m => m.extraWastage > 0) // Only include materials with wastage
          .map(m => ({
            materialId: m.materialId,
            extraWastage: m.extraWastage,
            wastageReason: m.wastageReason
          })),
        remarks: formData.remarks
      };

      // Only submit if there's at least one material with wastage
      if (wastageData.materialUsage.length === 0) {
        setError('Please add wastage for at least one material');
        setIsSubmitting(false);
        return;
      }

      // Add extra wastage
      await api.post('/production/extra-wastage', wastageData);

      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add extra wastage');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Add Extra Wastage - PO# {order.poNo}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
                <p className="text-gray-500">Loading materials data...</p>
              </div>
            ) : formData.materialUsage.length > 0 ? (
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Material Wastage</h5>

                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Required Qty with Standard Wastage</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Extra Wastage</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total Required</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.materialUsage.map((material, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{material.materialName}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.itemCode || '-'}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{material.requiredQty || 0} + {material.standardWastage || 0} {material.unit}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={material.extraWastage}
                              onChange={(e) => handleMaterialChange(index, 'extraWastage', e.target.value)}
                              className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {calculateTotalMaterialRequired(material).toFixed(2)} {material.unit}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={material.wastageReason}
                              onChange={(e) => handleMaterialChange(index, 'wastageReason', e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Reason"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 text-sm">No materials found for this order.</p>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={2}
                value={formData.remarks}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder="Add any additional notes or comments..."
              />
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Extra Wastage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderWastageModal;