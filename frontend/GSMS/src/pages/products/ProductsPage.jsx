import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../redux/slices/productsSlice';
import { fetchCustomers } from '../../redux/slices/customersSlice';
import ProductFormModal from '../../components/products/ProductFormModal';
import DeleteProductModal from '../../components/products/DeleteProductModal';
import AddProductWastageModal from '../../components/production/AddProductWastageModal';
import ViewProductWastageModal from '../../components/production/ViewProductWastageModal';
import { Link } from 'react-router-dom';
import { getUserFromToken } from '../../redux/slices/authSlice';
import { PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';

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
  const [showAddWastageModal, setShowAddWastageModal] = useState(false);
  const [showViewWastageModal, setShowViewWastageModal] = useState(false);
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

  const handleAddWastageClick = (product) => {
    setSelectedProduct(product);
    setShowAddWastageModal(true);
  };

  const handleViewWastageClick = (product) => {
    setSelectedProduct(product);
    setShowViewWastageModal(true);
  };

  const handleWastageSuccess = () => {
    setShowAddWastageModal(false);
    setShowViewWastageModal(false);
    dispatch(fetchProducts()); // Refresh products to show updated wastage data
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
          <table className="min-w-full divide-y divide-gray-300 rounded-md overflow-hidden shadow-sm border border-gray-200">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Style No</th>
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Item Name</th>
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">BOM</th>
      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Wastage</th>
      {(canAddEditProducts || canDeleteProducts) && (
        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
      )}
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {filteredProducts.length === 0 ? (
      <tr>
        <td colSpan={(canAddEditProducts || canDeleteProducts) ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
          No products found
        </td>
      </tr>
    ) : (
      filteredProducts.map((product) => (
        <tr key={product.id || product._id} className="hover:bg-gray-50 transition">
          <td className="px-4 py-4 text-sm font-medium text-gray-800">{product.styleNo}</td>
          <td className="px-4 py-4 text-sm font-medium text-gray-800">{product.itemName}</td>
          <td className="px-4 py-4 text-sm text-gray-500">
            {product.customer?.name || '—'}
            {product.customer?.country && (
              <span className="text-xs text-gray-400 ml-1">({product.customer.country})</span>
            )}
          </td>
          <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-xs">{product.description || '—'}</td>

          {/* View BOM Button */}
          <td className="px-4 py-4 text-center">
            <Link
              to={`/products/${product._id}/bom`}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              title="View/Edit BOM"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              BOM
            </Link>
          </td>

          {/* Wastage Buttons */}
          <td className="px-4 py-4 text-center space-x-2">
            <button
              onClick={() => handleViewWastageClick(product)}
              className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
              title="View Wastage"
            >
              <EyeIcon className="h-5 w-5 mr-1" />
              View
            </button>
            {canAddEditProducts && (
              <button
                onClick={() => handleAddWastageClick(product)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                title="Set Wastage"
              >
                <PencilSquareIcon className="h-5 w-5 mr-1" />
                Set
              </button>
            )}
          </td>

          {/* Action Buttons */}
          {(canAddEditProducts || canDeleteProducts) && (
            <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
              {canAddEditProducts && (
                <button
                  onClick={() => handleEditClick(product)}
                  className="inline-block px-3 py-1 text-blue-700 border border-blue-600 rounded hover:bg-blue-50 transition text-sm"
                  title="Edit product"
                >
                  Edit
                </button>
              )}
              {canDeleteProducts && (
                <button
                  onClick={() => handleDeleteClick(product)}
                  className="inline-block px-3 py-1 text-red-700 border border-red-600 rounded hover:bg-red-50 transition text-sm"
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

      {/* Add/Edit Wastage Modal */}
      {selectedProduct && (
        <>
          <AddProductWastageModal
            isOpen={showAddWastageModal}
            onClose={() => setShowAddWastageModal(false)}
            onSuccess={handleWastageSuccess}
            product={selectedProduct}
          />
          
          <ViewProductWastageModal
            isOpen={showViewWastageModal}
            onClose={() => setShowViewWastageModal(false)}
            product={selectedProduct}
          />
        </>
      )}
    </div>
  );
};

export default ProductsPage;