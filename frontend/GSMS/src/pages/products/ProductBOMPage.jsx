import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById, fetchProductBOM, clearCurrentProduct } from '../../redux/slices/productsSlice';
import { fetchCustomers } from '../../redux/slices/customersSlice';

const ProductBOMPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProduct, currentBOM, isLoading, error } = useSelector((state) => state.products);
  const { customers } = useSelector((state) => state.customers);

  // Create a map of customer IDs to customer objects for quick lookup
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach(customer => {
      map[customer._id] = customer;
    });
    return map;
  }, [customers]);

  // Get the customer for the current product
  const productCustomer = useMemo(() => {
    if (!currentProduct?.customer) return null;
    return typeof currentProduct.customer === 'string' 
      ? customerMap[currentProduct.customer] 
      : currentProduct.customer;
  }, [currentProduct, customerMap]);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      dispatch(fetchProductBOM(id));
      // Fetch all customers to map customer IDs to names
      dispatch(fetchCustomers({ page: 1, limit: 1000 }));
    }

    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!currentProduct || !currentBOM) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Loading product information...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          to="/products"
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Back to Products
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Product Information
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Style No</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentProduct.styleNo}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Item Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentProduct.itemName}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentProduct.description}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {productCustomer ? (
                  <div>
                    <div className="font-medium">{productCustomer.name}</div>
                    {productCustomer.country && (
                      <div className="text-gray-500">{productCustomer.country}</div>
                    )}
                    {productCustomer.email && (
                      <div className="text-gray-500 text-sm">{productCustomer.email}</div>
                    )}
                    {productCustomer.phone && (
                      <div className="text-gray-500 text-sm">{productCustomer.phone}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No customer assigned</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Bill of Materials (BOM)
          </h3>
        </div>
        <div className="border-t border-gray-200">
          {currentBOM.bom && currentBOM.bom.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Per Piece
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBOM.bom.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.materialName || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.itemCode || "No Code"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantityPerPiece} {item.unit || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              No materials defined for this product.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBOMPage; 