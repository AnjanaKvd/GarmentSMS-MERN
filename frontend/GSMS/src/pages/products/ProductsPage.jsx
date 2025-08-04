import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../redux/slices/productsSlice';
import { fetchCustomers } from '../../redux/slices/customersSlice';
import ProductFormModal from '../../components/products/ProductFormModal';
import DeleteProductModal from '../../components/products/DeleteProductModal';
import { Link } from 'react-router-dom';
import { getUserFromToken } from '../../redux/slices/authSlice';

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error } = useSelector((state) => state.products);
  const { customers } = useSelector((state) => state.customers);
  const { token } = useSelector((state) => state.auth);
  const user = getUserFromToken(token);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Define role-based permissions
  const canAddEditProducts = ['ADMIN', 'MANAGER'].includes(user?.role);
  const canDeleteProducts = ['ADMIN'].includes(user?.role);
  const canViewProducts = ['ADMIN', 'MANAGER', 'PRODUCTION', 'VIEWER'].includes(user?.role);

  // Create a map of customer IDs to customer objects for quick lookup
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach(customer => {
      map[customer._id] = customer;
    });
    return map;
  }, [customers]);

  // Enhance products with customer details
  const enhancedProducts = useMemo(() => {
    return products.map(product => ({
      ...product,
      // If customer is just an ID, look up the full customer object
      // Otherwise, use the customer object as is
      customer: typeof product.customer === 'string'
        ? customerMap[product.customer]
        : product.customer
    }));
  }, [products, customerMap]);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCustomers({ page: 1, limit: 1000 })); // Fetch all customers
  }, [dispatch]);

  const handleAddClick = () => {
    setSelectedProduct(null);
    setShowAddModal(true);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const filteredProducts = enhancedProducts.filter(product =>
    product.styleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.customer?.name && product.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Products Management</h1>
        {canAddEditProducts && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Add new product"
          >
            Add New Product
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by style no or name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Style No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BOM
                </th>
                {(canAddEditProducts || canDeleteProducts) && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={(canAddEditProducts || canDeleteProducts) ? 6 : 5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id || product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.styleNo}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {product.itemName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.customer?.name || '—'}
                      {product.customer?.country && (
                        <span className="text-xs text-gray-400 ml-1">({product.customer.country})</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {product.description || '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <Link
                        to={`/products/${product.id || product._id}/bom`}
                        className="inline-block px-3 py-1 text-sm font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50 transition"
                      >
                        View BOM
                      </Link>
                    </td>
                    {(canAddEditProducts || canDeleteProducts) && (
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {canAddEditProducts && (
                          <button
                            onClick={() => handleEditClick(product)}
                            className="inline-block px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition"
                            title="Edit product"
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteProducts && (
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="inline-block px-3 py-1 text-sm font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
                            title="Delete product"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>

                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      <ProductFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        product={null}
      />

      {/* Edit Product Modal */}
      <ProductFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={selectedProduct}
      />

      {/* Delete Product Modal */}
      <DeleteProductModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductsPage;