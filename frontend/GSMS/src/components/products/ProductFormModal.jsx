import { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, updateProduct } from '../../redux/slices/productsSlice';
import { fetchMaterials } from '../../redux/slices/materialsSlice';
import { fetchCustomers, createCustomer } from '../../redux/slices/customersSlice';
import { useNotification } from '../common/Notification';
import { XMarkIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ProductFormModal = ({ isOpen, onClose, product = null }) => {
  const dispatch = useDispatch();
  const { showNotification } = useNotification();
  const { materials } = useSelector((state) => state.materials);
  const { customers } = useSelector((state) => state.customers);
  const [formData, setFormData] = useState({
    styleNo: '',
    itemName: '',
    description: '',
    customer: null,
    materialsRequired: []
  });
  const [materialInput, setMaterialInput] = useState({
    materialId: '',
    quantityPerPiece: 0
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (materials.length === 0) {
      dispatch(fetchMaterials());
    }
    
    // Fetch customers when modal opens
    if (isOpen) {
      dispatch(fetchCustomers({ page: 1, limit: 1000 })); // Fetch all customers with a high limit
    }

    if (product) {
      setFormData({
        styleNo: product.styleNo || '',
        itemName: product.itemName || '',
        description: product.description || '',
        customer: product.customer || null,
        materialsRequired: product.materialsRequired || []
      });
      setErrors({});
    } else if (!isOpen) {
      // Only reset form when modal is closed
      resetForm();
    }
  }, [dispatch, product, materials.length, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
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
    
    const existingIndex = formData.materialsRequired.findIndex(
      m => m.materialId === materialInput.materialId
    );
    
    if (existingIndex !== -1) {
      const updatedMaterials = [...formData.materialsRequired];
      updatedMaterials[existingIndex] = materialInput;
      
      setFormData({
        ...formData,
        materialsRequired: updatedMaterials
      });
    } else {
      setFormData({
        ...formData,
        materialsRequired: [...formData.materialsRequired, { ...materialInput }]
      });
    }
    
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
      newErrors.styleNo = 'Style Number is required';
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

  const resetForm = () => {
    setFormData({
      styleNo: '',
      itemName: '',
      description: '',
      customer: null,
      materialsRequired: []
    });
    setMaterialInput({
      materialId: '',
      quantityPerPiece: 0
    });
    setSearchTerm('');
    setIsDropdownOpen(false);
    setIsCreatingCustomer(false);
    setErrors({});
  };

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.includes(term))
    );
  }, [customers, searchTerm]);

  // Check if we should show the "Create new customer" option
  const showCreateOption = useMemo(() => {
    if (!searchTerm || isCreatingCustomer) return false;
    const term = searchTerm.trim().toLowerCase();
    return term.length > 0 && !customers.some(c => c.name.toLowerCase() === term);
  }, [searchTerm, customers, isCreatingCustomer]);

  const handleCustomerSelect = (customer) => {
    setFormData({ ...formData, customer });
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);
    setIsCreatingCustomer(false);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    try {
      const newCustomer = await dispatch(createCustomer({
        name: searchTerm.trim(),
        // Add other default fields if needed
      })).unwrap();
      
      setFormData({ ...formData, customer: newCustomer });
      setSearchTerm(newCustomer.name);
      setIsDropdownOpen(false);
      showNotification('Customer created successfully', 'success');
    } catch (error) {
      showNotification(error || 'Failed to create customer', 'error');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && showCreateOption) {
      handleCreateCustomer(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Prepare the data to be sent
    const productData = {
      ...formData,
      customer: formData.customer?._id || null // Send only the customer ID or null
    };
    
    try {
      if (product) {
        await dispatch(updateProduct({ id: product._id, productData })).unwrap();
        showNotification('Product updated successfully', 'success');
      } else {
        await dispatch(createProduct(productData)).unwrap();
        showNotification('Product created successfully', 'success');
      }
      onClose();
    } catch (error) {
      showNotification(error || 'An error occurred', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">​</span>
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
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="styleNo" className="block text-sm font-medium text-gray-700">
                      Style Number *
                    </label>
                    <input
                      type="text"
                      name="styleNo"
                      id="styleNo"
                      value={formData.styleNo}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.styleNo ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      placeholder="Enter style number (e.g., ST0001)"
                    />
                    {errors.styleNo && (
                      <p className="mt-1 text-sm text-red-600">{errors.styleNo}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      name="itemName"
                      id="itemName"
                      value={formData.itemName}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.itemName ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      placeholder="Enter item name"
                    />
                    {errors.itemName && (
                      <p className="mt-1 text-sm text-red-600">{errors.itemName}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleChange}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>
                  
                  <div className="mb-4" ref={dropdownRef}>
                    <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700">
                      Customer (Optional)
                    </label>
                    <div className="relative mt-1">
                      <div className="relative">
                        <input
                          type="text"
                          id="customer-search"
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                          placeholder="Search or add customer..."
                          value={searchTerm || (formData.customer?.name || '')}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value === '') {
                              setFormData({ ...formData, customer: null });
                            }
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          onKeyDown={handleSearchKeyDown}
                        />
                        {formData.customer ? (
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                              setFormData({ ...formData, customer: null });
                              setSearchTerm('');
                            }}
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer._id}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                                  formData.customer?._id === customer._id ? 'bg-indigo-100' : ''
                                }`}
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                <div className="flex items-center">
                                  <span className="font-medium truncate">
                                    {customer.name}
                                    {customer.country && ` (${customer.country})`}
                                  </span>
                                  {customer.email && (
                                    <span className="ml-2 text-xs text-gray-500 truncate">{customer.email}</span>
                                  )}
                                </div>
                                {formData.customer?._id === customer._id && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                    <CheckIcon className="h-5 w-5" />
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No customers found
                            </div>
                          )}
                          
                          {showCreateOption && (
                            <div 
                              className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-indigo-600 hover:bg-indigo-50"
                              onClick={handleCreateCustomer}
                            >
                              <div className="flex items-center">
                                <PlusIcon className="h-4 w-4 mr-2" />
                                <span>Create "{searchTerm}"</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.customer && (
                      <div className="mt-1 text-xs text-gray-500">
                        Press backspace and enter to edit, or click X to clear
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Bill of Materials *</h4>
                    
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">Material</label>
                          <select
                            name="materialId"
                            value={materialInput.materialId}
                            onChange={handleMaterialInputChange}
                            className={`mt-1 block w-full border ${
                              errors.materialId ? 'border-red-500' : 'border-gray-300'
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          >
                            <option value="">Select material...</option>
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
                        
                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700">Quantity</label>
                          <input
                            type="number"
                            name="quantityPerPiece"
                            value={materialInput.quantityPerPiece || ''}
                            onChange={handleMaterialInputChange}
                            step="0.01"
                            min="0"
                            placeholder="Qty/Piece"
                            className={`mt-1 block w-full border ${
                              errors.quantityPerPiece ? 'border-red-500' : 'border-gray-300'
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          />
                          {errors.quantityPerPiece && (
                            <p className="mt-1 text-sm text-red-600">{errors.quantityPerPiece}</p>
                          )}
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={addMaterial}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      
                      {formData.materialsRequired.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Material
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="px-4 py-2"></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formData.materialsRequired.map((material, index) => {
                                const materialData = materials.find(m => 
                                  (m.id || m._id) === material.materialId
                                );
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
                      ) : errors.materialsRequired ? (
                        <p className="text-sm text-red-600">{errors.materialsRequired}</p>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600 italic">
                    Note: Add without wastage. Wastages can be added from the{' '}
                    <Link to="/production" className="text-indigo-600 hover:text-indigo-800">
                      production
                    </Link>{' '}
                    page.
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    >
                      {product ? 'Update' : 'Create'} Product
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
