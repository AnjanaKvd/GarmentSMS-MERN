import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const ViewProductWastageModal = ({ isOpen, onClose, product }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wastageData, setWastageData] = useState({
    materialsWastage: [],
    remarks: ''
  });

  useEffect(() => {
    if (product && isOpen) {
      fetchProductWastageData();
    }
  }, [product, isOpen]);
  
  const fetchProductWastageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch wastage data
      const response = await api.get(`/products/${product._id}/wastage`);
      
      setWastageData({
        materialsWastage: response.data.materialsWastage || [],
        remarks: response.data.remarks || ''
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load product wastage data');
      console.error(err);
      setLoading(false);
    }
  };

  const calculateWastageQty = (material) => {
    // If wastage percentage is set, calculate the wastage quantity
    if ((material.quantityPerPiece || 0) > 0 && (material.expectedWastagePercentage || 0) > 0) {
      return ((material.quantityPerPiece * material.expectedWastagePercentage) / 100).toFixed(2);
    }
    return '0.00';
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Standard Wastage Details - {product.itemName} ({product.styleNo})
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
              <h4 className="text-sm font-medium text-gray-700 mb-2">Product Information</h4>
              <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Name:</span> {product.itemName}</p>
              <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Style No:</span> {product.styleNo}</p>
              {product.description && (
                <p className="text-sm text-gray-600"><span className="font-medium">Description:</span> {product.description}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-gray-500">Loading wastage data...</p>
            </div>
          ) : wastageData.materialsWastage?.length > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Standard Wastage
              </label>
              
              <div className="border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Material</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty/Piece</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Expected Wastage %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Expected Wastage Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {wastageData.materialsWastage.map((material, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{material.materialName}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{material.itemCode || '-'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{material.unit || '-'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{material.quantityPerPiece || 0}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{material.expectedWastagePercentage || 0}%</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {calculateWastageQty(material)} {material.unit || ''}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-sm text-gray-500">{material.remarks || '-'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700 text-sm">No wastage data found for this product.</p>
            </div>
          )}

          {wastageData.remarks && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">General Remarks</h5>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">{wastageData.remarks}</p>
              </div>
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

export default ViewProductWastageModal; 