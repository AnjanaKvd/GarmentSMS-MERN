import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid';

const OrderFormModal = ({ isOpen, onClose, onSuccess, order }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    description: '',
    orderDate: new Date().toISOString().split('T')[0] // Default to today's date in YYYY-MM-DD format
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data);
        
        // If editing an existing order, set the form data
        if (order && order._id) {
          setFormData({
            productId: order.productId?._id || order.productId || '',
            quantity: order.quantity || '',
            description: order.description || '',
            orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
          
          // Set the search query to the product name for display
          const product = response.data.find(p => p._id === (order.productId?._id || order.productId));
          if (product) {
            setSearchQuery(`${product.itemName} (${product.styleNo})`);
          }
        }
      } catch (err) {
        setError('Failed to fetch products');
      }
    };

    if (isOpen) {
      fetchProducts();
    }
    
    // Reset form when modal is closed
    return () => {
      setFormData({ 
        productId: '', 
        quantity: '',
        description: '',
        orderDate: new Date().toISOString().split('T')[0]
      });
      setSearchQuery('');
      setError(null);
    };
  }, [isOpen, order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductSelect = (product) => {
    setFormData(prev => ({
      ...prev,
      productId: product?._id || ''
    }));
    
    // Update search query to show the selected product
    if (product) {
      setSearchQuery(`${product.itemName} (${product.styleNo})`);
    }
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.itemName?.toLowerCase().includes(query) || 
      product.styleNo?.toLowerCase().includes(query) ||
      product._id?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Get the selected product object
  const selectedProduct = useMemo(() => {
    return products.find(p => p._id === formData.productId) || null;
  }, [products, formData.productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (order && order._id) {
        // Update existing order
        await api.patch(`/orders/${order._id}`, formData);
      } else {
        // Create new order
        await api.post('/orders', formData);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${order?._id ? 'update' : 'create'} order`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
                    {order?._id ? 'Edit Order' : 'New Order'}
                  </h3>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                  <div className="relative">
                    <Combobox as="div" value={selectedProduct} onChange={handleProductSelect}>
                      <Combobox.Label className="block text-sm font-medium text-gray-700">
                        Product
                      </Combobox.Label>
                      <div className="relative mt-1">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                          <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            displayValue={(product) => product ? `${product.itemName} - ${product.styleNo}` : ''}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search products..."
                            autoComplete="off"
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </Combobox.Button>
                        </div>
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {filteredProducts.length === 0 && searchQuery !== '' ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                              Nothing found.
                            </div>
                          ) : (
                            filteredProducts.map((product) => (
                              <Combobox.Option
                                key={product._id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                  }`
                                }
                                value={product}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {product.itemName} - {product.styleNo}
                                    </span>
                                    {selected ? (
                                      <span
                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active ? 'text-white' : 'text-indigo-600'
                                        }`}
                                      >
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </div>
                    </Combobox>
                    <input
                      type="hidden"
                      name="productId"
                      value={formData.productId || ''}
                      required
                    />
                  </div>

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
                      required
                      min="1"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* New fields for description and order date */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter order description"
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
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
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

export default OrderFormModal;