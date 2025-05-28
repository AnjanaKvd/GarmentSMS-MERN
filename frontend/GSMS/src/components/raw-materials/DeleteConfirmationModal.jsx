import { useDispatch, useSelector } from 'react-redux';
import { deleteMaterial } from '../../redux/slices/materialsSlice';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../common/Notification';

const DeleteConfirmationModal = ({ onClose, material }) => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const { isLoading } = useSelector((state) => state.materials);

  const handleDelete = async () => {
    try {
      // Use _id if id is not available
      const materialId = material.id || material._id;
      await dispatch(deleteMaterial(materialId)).unwrap();
      onClose();
      showNotification(
        `Material ${material.name} (${material.itemCode}) deleted successfully`,
        'success'
      );
    } catch (error) {
      showNotification(
        `Failed to delete material: ${error.message || 'Unknown error'}`,
        'error'
      );
      console.error('Failed to delete material:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delete Material
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the material <span className="font-medium">{material.name}</span> ({material.itemCode})? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleDelete}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-red-300"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
