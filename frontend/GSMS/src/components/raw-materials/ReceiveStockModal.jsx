import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { receiveMaterialStock } from '../../redux/slices/materialsSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ReceiveStockModal = ({ onClose, material }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.materials);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      quantity: '',
      remarks: ''
    }
  });

  useEffect(() => {
    // Check if material has a valid ID
    if (!material || (!material.id && !material._id)) {
      console.error("Invalid material object for receiving stock", material);
      onClose();
    }
  }, [material, onClose]);

  const onSubmit = async (data) => {
    try {
      data.quantity = parseFloat(data.quantity);
      // Use _id if id is not available (API compatibility)
      const materialId = material.id || material._id;
      await dispatch(receiveMaterialStock({ id: materialId, stockData: data })).unwrap();
      onClose();
    } catch (error) {
      // Error is handled in the slice
      console.error('Failed to receive stock:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Receive Stock: {material.name}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 bg-gray-50 p-3 rounded">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Item Code:</dt>
              <dd className="text-gray-900">{material.itemCode}</dd>
              <dt className="text-gray-500">Current Stock:</dt>
              <dd className="text-gray-900 font-medium">{material.currentStock} {material.unit}</dd>
            </dl>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity to Receive ({material.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                id="quantity"
                {...register('quantity', { 
                  required: 'Quantity is required', 
                  min: { 
                    value: 0.01, 
                    message: 'Quantity must be positive' 
                  },
                  valueAsNumber: true
                })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.quantity && (
                <p className="mt-2 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                id="remarks"
                {...register('remarks')}
                placeholder="e.g. New shipment from Supplier X, PO #12345"
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
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Receive Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiveStockModal;
