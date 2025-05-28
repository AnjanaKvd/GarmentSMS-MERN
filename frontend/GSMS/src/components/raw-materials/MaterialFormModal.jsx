// src/components/raw-materials/MaterialFormModal.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { createMaterial, updateMaterial } from '../../redux/slices/materialsSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MaterialFormModal = ({ onClose, isEdit = false, material = null }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.materials);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: isEdit && material ? {
      itemCode: material.itemCode,
      name: material.name,
      unit: material.unit,
      currentStock: material.currentStock,
      description: material.description || '',
    } : {}
  });

  useEffect(() => {
    // Only validate material if in edit mode
    if (isEdit && (!material || (!material.id && !material._id))) {
      console.error("Invalid material object for editing", material);
      onClose(); // Close the modal if material is invalid in edit mode
    }
    
    // Set form values if editing
    if (isEdit && material) {
      reset({
        itemCode: material.itemCode,
        name: material.name,
        unit: material.unit,
        currentStock: material.currentStock,
        description: material.description || '',
      });
    }
  }, [isEdit, material, reset, onClose]);

  const onSubmit = async (data) => {
    // Convert currentStock to number
    data.currentStock = parseFloat(data.currentStock);
    
    try {
      if (isEdit) {
        // Use _id if id is not available (API compatibility)
        const materialId = material.id || material._id;
        await dispatch(updateMaterial({ id: materialId, materialData: data })).unwrap();
      } else {
        await dispatch(createMaterial(data)).unwrap();
      }
      onClose();
    } catch (error) {
      // Error is handled in the slice
      console.error('Failed to save material:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {isEdit ? 'Edit Raw Material' : 'Add New Raw Material'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label htmlFor="itemCode" className="block text-sm font-medium text-gray-700">
                Item Code *
              </label>
              <input
                type="text"
                id="itemCode"
                {...register('itemCode', { required: 'Item code is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isEdit} // Don't allow editing item code
              />
              {errors.itemCode && (
                <p className="mt-2 text-sm text-red-600">{errors.itemCode.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Material Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Material name is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                Unit of Measurement *
              </label>
              <select
                id="unit"
                {...register('unit', { required: 'Unit is required' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select Unit</option>
                <option value="m">meters (m)</option>
                <option value="cm">centimeters (cm)</option>
                <option value="kg">kilograms (kg)</option>
                <option value="g">grams (g)</option>
                <option value="yards">yards</option>
                <option value="pcs">pieces (pcs)</option>
                <option value="rolls">rolls</option>
              </select>
              {errors.unit && (
                <p className="mt-2 text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">
                Current Stock *
              </label>
              <input
                type="number"
                step="0.01"
                id="currentStock"
                {...register('currentStock', { 
                  required: 'Current stock is required',
                  min: { 
                    value: 0, 
                    message: 'Stock cannot be negative' 
                  }
                })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isEdit} // Can't directly edit current stock for existing materials
              />
              {errors.currentStock && (
                <p className="mt-2 text-sm text-red-600">{errors.currentStock.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : isEdit ? 'Update Material' : 'Add Material'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaterialFormModal;