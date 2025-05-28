import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, updateProduct } from '../../redux/slices/productsSlice';
import { fetchMaterials } from '../../redux/slices/materialsSlice';
import { useNotification } from '../common/Notification';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProductFormModal = ({ isOpen, onClose, product = null }) => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const { materials } = useSelector((state) => state.materials);
  const [formData, setFormData] = useState({
    styleNo: '',
    itemName: '',
    description: '',
    materialsRequired: []
  });
  const [materialInput, setMaterialInput] = useState({
    materialId: '',
    quantityPerPiece: 0
  });
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (materials.length === 0) {
      dispatch(fetchMaterials());
    }
    
    if (product) {
      setFormData({
        styleNo: product.styleNo || '',
        itemName: product.itemName || '',
        description: product.description || '',
        materialsRequired: product.materialsRequired || []
      });
      setErrors({});
    } else {
      setFormData({
        styleNo: '',
        itemName: '',
        description: '',
        materialsRequired: []
      });
      setErrors({});
    }
  }, [dispatch, product, materials.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleMaterialInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'materialId') {
      const isValidId = materials.some(m => (m.id || m._id) === value);
      
      if (isValidId) {
        setMaterialInput({
          ...materialInput,
          materialId: value
        });
      }
    } else {
      setMaterialInput({
        ...materialInput,
        [name]: name === 'quantityPerPiece' ? parseFloat(value) : value
      });
    }
  };

  const addMaterial = () => {
    if (!materialInput.materialId || materialInput.quantityPerPiece <= 0) {
      if (!materialInput.materialId) {
        setErrors({
          ...errors,
          materialId: 'Please select a material'
        });
      }
      if (materialInput.quantityPerPiece <= 0) {
        setErrors({
          ...errors,
          quantityPerPiece: 'Quantity must be greater than 0'
        });
      }
      return;
    }
    
    // Check if material already exists
    const existingIndex = formData.materialsRequired.findIndex(
      m => m.materialId === materialInput.materialId
    );
    
    if (existingIndex !== -1) {
      // Update existing material
      const updatedMaterials = [...formData.materialsRequired];
      updatedMaterials[existingIndex] = materialInput;
      
      setFormData({
        ...formData,
        materialsRequired: updatedMaterials
      });
    } else {
      // Add new material
      setFormData({
        ...formData,
        materialsRequired: [...formData.materialsRequired, { ...materialInput }]
      });
    }
    
    // Reset input
    setMaterialInput({ materialId: '', quantityPerPiece: 0 });
    setErrors({
      ...errors,
      materialId: null,
      quantityPerPiece: null
    });
  };

  const removeMaterial = (materialId) => {
    setFormData({
      ...formData,
      materialsRequired: formData.materialsRequired.filter(
        m => m.materialId !== materialId
      )
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.styleNo.trim()) {
      newErrors.styleNo = 'Style No is required';
    }
    
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item Name is required';
    }
    
    if (formData.materialsRequired.length === 0) {
      newErrors.materialsRequired = 'At least one material is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (product) {
        await dispatch(updateProduct({ id: product.id || product._id, productData: formData })).unwrap();
        showNotification(`Product ${formData.itemName} (${formData.styleNo}) updated successfully`, 'success');
      } else {
        await dispatch(createProduct(formData)).unwrap();
        showNotification(`Product ${formData.itemName} (${formData.styleNo}) created successfully`, 'success');
      }
      onClose();
    } catch (error) {
      showNotification(`Failed to ${product ? 'update' : 'create'} product: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {product ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Style No *</label>
                      <input
                        type="text"
                        name="styleNo"
                        value={formData.styleNo}
                        onChange={handleChange}
                        className={`mt-1 block w-full border ${errors.styleNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      />
                      {errors.styleNo && (
                        <p className="mt-1 text-sm text-red-600">{errors.styleNo}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                      <input
                        type="text"
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleChange}
                        className={`mt-1 block w-full border ${errors.itemName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      />
                      {errors.itemName && (
                        <p className="mt-1 text-sm text-red-600">{errors.itemName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      ></textarea>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900">Bill of Materials *</h4>
                      
                      {/* Material selection with built-in search */}
                      <div className="mt-2 space-y-2">
                        <div className="flex-1 relative">
                          <select
                            name="materialId"
                            value={materialInput.materialId}
                            onChange={handleMaterialInputChange}
                            className={`block w-full border ${errors.materialId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          >
                            <option value="">Search and select material...</option>
                            {materials.map((material) => (
                              <option 
                                key={material.id || material._id} 
                                value={material.id || material._id}
                              >
                                {material.name || material.itemName} ({material.itemCode})
                              </option>
                            ))}
                          </select>
                          {errors.materialId && (
                            <p className="mt-1 text-sm text-red-600">{errors.materialId}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-32">
                            <input
                              type="number"
                              name="quantityPerPiece"
                              value={materialInput.quantityPerPiece}
                              onChange={handleMaterialInputChange}
                              step="0.01"
                              min="0"
                              placeholder="Qty/Piece"
                              className={`block w-full border ${errors.quantityPerPiece ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                            />
                            {errors.quantityPerPiece && (
                              <p className="mt-1 text-sm text-red-600">{errors.quantityPerPiece}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={addMaterial}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {/* Materials list */}
                      <div className="mt-3">
                        {formData.materialsRequired.length > 0 ? (
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {formData.materialsRequired.map((material, index) => {
                                  const materialData = materials.find(m => (m.id || m._id) === material.materialId);
                                  return (
                                    <tr key={index}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {materialData ? 
                                          `${materialData.name || materialData.itemName} (${materialData.itemCode})` : 
                                          'Material not found'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {material.quantityPerPiece} {materialData?.unit || ''}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                          type="button"
                                          onClick={() => removeMaterial(material.materialId)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          errors.materialsRequired && (
                            <p className="text-sm text-red-600">{errors.materialsRequired}</p>
                          )
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {product ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;