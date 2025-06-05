import React from 'react';
import { Link } from 'react-router-dom';

const ProductList = ({ products }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Top Products</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {products.length > 0 ? (
          products.map((product) => (
            <li key={product.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <Link to={`/products/${product.id}`} className="block">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{product.name}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {product.category}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Style: {product.styleNo}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))
        ) : (
          <li className="px-4 py-5 sm:px-6 text-center text-sm text-gray-500">
            No products available
          </li>
        )}
      </ul>
      <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
        <Link
          to="/products"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View all products
        </Link>
      </div>
    </div>
  );
};

export default ProductList;