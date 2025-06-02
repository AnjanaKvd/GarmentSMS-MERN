import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const AddProductWastageModal = ({ isOpen, onClose, onSuccess, product }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    materialWastage: [],
    remarks: ''
  });

  useEffect(() => {
    if (product && isOpen) {
      fetchWastageData();
    }
  }, [product, isOpen]);
  
  const fetchWastageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch existing wastage data directly from the wastage endpoint
      const wastageResponse = await api.get(`/products/${product._id}/wastage`);
      const wastageData = wastageResponse.data;
      
      // Set form data based on the waste response
      setFormData({
        materialWastage: wastageData.materialsWastage.map(material => ({
          materialId: material.materialId,
          materialName: material.materialName,
          itemCode: material.itemCode,
          unit: material.unit,
          quantityPerPiece: material.quantityPerPiece,
          expectedWastagePercentage: material.expectedWastagePercentage || 0,
          remarks: material.remarks || ''
        })),
        remarks: wastageData.remarks || ''
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wastage data:', err);
      
      // If wastage data fails, try to get BOM data as fallback
      try {
        const bomResponse = await api.get(`/products/${product._id}/bom`);
        const bomMaterials = bomResponse.data.bom || [];
        
        setFormData({
          materialWastage: bomMaterials.map(material => ({
            materialId: material.materialId,
            materialName: material.materialName,
            itemCode: material.itemCode || '',
            unit: material.unit || '',
            quantityPerPiece: material.quantityPerPiece || 0,
            expectedWastagePercentage: material.expectedWastagePercentage || 0,
            remarks: material.wastageRemarks || ''
          })),
          remarks: product.wastageRemarks || ''
        });
      } catch (bomErr) {
        setError('Failed to load product materials');
        console.error(bomErr);
      }
      
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.materialWastage];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: field === 'expectedWastagePercentage' ? parseFloat(value) || 0 : value
    };
    
    setFormData({ ...formData, materialWastage: updatedMaterials });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format the data to match the API expectations
      const wastageData = {
        materialsWastage: formData.materialWastage.map(m => ({
          materialId: m.materialId,
          materialName: m.materialName,
          itemCode: m.itemCode,
          unit: m.unit,
          quantityPerPiece: m.quantityPerPiece,
          expectedWastagePercentage: m.expectedWastagePercentage,
          remarks: m.remarks
        })),
        remarks: formData.remarks
      };
      
      // Update product's expected wastage for each material
      await api.patch(`/products/${product._id}/wastage`, wastageData);
      
      setIsSubmitting(false); // Reset submit state
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product wastage');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {product.styleNo && formData.materialWastage.some(m => m.expectedWastagePercentage > 0) 
              ? `Update Standard Wastage - ${product.itemName} (${product.styleNo})`
              : `Set Standard Wastage - ${product.itemName} (${product.styleNo})`}
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
            ) : formData.materialWastage.length > 0 ? (
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
                      {formData.materialWastage.map((material, index) => (
                        <tr key={index}>
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
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={material.expectedWastagePercentage}
                              onChange={(e) => handleMaterialChange(index, 'expectedWastagePercentage', e.target.value)}
                              className="mt-0 block w-24 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                              required
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {calculateWastageQty(material)} {material.unit || ''}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <input
                              type="text"
                              value={material.remarks || ''}
                              onChange={(e) => handleMaterialChange(index, 'remarks', e.target.value)}
                              className="mt-0 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                              placeholder="Optional reason for wastage"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 text-sm">No materials found for this product. Add materials to the product's BOM first.</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                General Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Any additional notes about wastage"
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
              disabled={isSubmitting || formData.materialWastage.length === 0}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Standard Wastage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductWastageModal;
