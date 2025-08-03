import React from 'react';
import { Link } from 'react-router-dom';

const getStatusBadge = (status) => {
  const statusClasses = {
    COMPLETED: 'bg-green-100 text-green-800',
    PRODUCING: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-blue-100 text-blue-800'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusClasses[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const RecentOrdersTable = ({ 
  title, 
  data = [], 
  columns = [],
  emptyMessage = 'No orders found',
  viewAllLink = '/orders'
}) => {
  // Render cell content based on column key
  const renderCellContent = (item, column) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }
    
    const value = item[column.key];
    
    switch (column.key) {
      case 'status':
        return getStatusBadge(value);
      case 'date':
      case 'createdAt':
      case 'updatedAt':
      case 'orderDate':
        return formatDate(value);
      case 'poNo':
        return (
          <Link
            to={`/orders/${item.id || ''}`}
            className="text-indigo-600 hover:text-indigo-900 font-medium"
          >
            {value}
          </Link>
        );
      case 'customer':
        return item.customer?.name || value || 'N/A';
      default:
        return value || '-';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          >
            View All
          </Link>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data && data.length > 0 ? (
                data.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {columns.map((column) => (
                      <td 
                        key={`${item.id || index}-${column.key}`} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                      >
                        {renderCellContent(item, column)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="mt-2">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default RecentOrdersTable;