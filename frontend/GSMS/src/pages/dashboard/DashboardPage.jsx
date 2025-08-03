import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../redux/slices/dashboardSlice';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Widget Components
import StatCard from './widgets/StatCard';
import RecentOrdersTable from './widgets/RecentOrdersTable';
import RecentActivityTable from './widgets/RecentActivityTable';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, isLoading, error } = useSelector((state) => state.dashboard);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);

  const loadDashboardData = async () => {
    setRefreshing(true);
    await dispatch(fetchDashboardStats());
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Column definitions for recent materials table
  const materialColumns = [
    {
      key: 'itemCode', 
      label: 'Item Code',
      render: (value, item) => (
        <Link to={`/raw-materials/${item.id}/ledger`} className="text-indigo-600 hover:text-indigo-900 font-medium">
          {value}
        </Link>
      )
    },
    { key: 'name', label: 'Material Name' },
    { 
      key: 'currentStock', 
      label: 'Stock',
      render: (value, item) => `${value} ${item.unit || ''}`.trim()
    },
    { 
      key: 'updatedDate', 
      label: 'Last Updated',
      render: (value) => formatDate(value)
    },
  ];

  // Column definitions for recent orders table
  const orderColumns = [
    { 
      key: 'poNo', 
      label: 'PO #',
      render: (value, item) => (
        <Link to={`/orders/${item.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
          {value}
        </Link>
      )
    },
    { 
      key: 'productName', 
      label: 'Product',
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">Style: {item.styleNo}</div>
        </div>
      )
    },
    { 
      key: 'quantity', 
      label: 'Qty',
      render: (value) => value || '0'
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          value === 'PRODUCING' ? 'bg-yellow-100 text-yellow-800' :
          value === 'PENDING' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.charAt(0) + value.slice(1).toLowerCase()}
        </span>
      )
    },
  ];

  // Calculate order status percentages for the chart
  const calculateOrderStatus = () => {
    const { orderStatusCounts = {}, totalOrders = 0 } = stats;
    
    if (totalOrders === 0) {
      return [
        { name: 'Completed', value: 0, color: 'bg-green-500' },
        { name: 'Producing', value: 0, color: 'bg-yellow-500' },
        { name: 'Pending', value: 0, color: 'bg-blue-500' }
      ];
    }

    return [
      {
        name: 'Completed',
        value: Math.round((orderStatusCounts.COMPLETED / totalOrders) * 100) || 0,
        color: 'bg-green-500',
        count: orderStatusCounts.COMPLETED || 0
      },
      {
        name: 'Producing',
        value: Math.round((orderStatusCounts.PRODUCING / totalOrders) * 100) || 0,
        color: 'bg-yellow-500',
        count: orderStatusCounts.PRODUCING || 0
      },
      {
        name: 'Pending',
        value: Math.round((orderStatusCounts.PENDING / totalOrders) * 100) || 0,
        color: 'bg-blue-500',
        count: orderStatusCounts.PENDING || 0
      },
    ];
  };

  const orderStatusData = calculateOrderStatus();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your Fabric Stock Management System
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link to="/raw-materials" className="block">
          <StatCard
            title="Total Raw Materials"
            value={stats.totalRawMaterials || 0}
            icon={<CubeIcon className="h-6 w-6 text-white" />}
            color="indigo"
          />
        </Link>
        <Link to="/low-stock-materials" className="block">
          <StatCard
            title="Low Stock Materials"
            value={stats.lowStockMaterials || 0}
            icon={<ExclamationTriangleIcon className="h-6 w-6 text-white" />}
            color="red"
          />
        </Link>
        <Link to="/orders" className="block">
          <StatCard
            title="Active POs"
            value={stats.activePurchaseOrders || 0}
            icon={<ClipboardDocumentListIcon className="h-6 w-6 text-white" />}
            color="yellow"
          />
        </Link>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Materials */}
        <div className="lg:col-span-1">
          <RecentActivityTable
            title="Recent Materials"
            data={stats.recentMaterials || []}
            columns={materialColumns}
            emptyMessage="No materials found. Add some materials to get started."
            viewAllLink="/materials"
          />
        </div>

        {/* Middle Column - Recent Orders */}
        <div className="lg:col-span-1">
          <RecentOrdersTable
            title="Recent Orders"
            data={stats.recentOrders || []}
            columns={orderColumns}
            emptyMessage="No orders found. Create a new order to get started."
            viewAllLink="/orders"
          />
        </div>

        {/* Right Column - Order Status Chart */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {orderStatusData.map((status) => (
                <div key={status.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600">{status.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{status.count} orders</span>
                    </div>
                    <span className="font-medium">{status.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status.color} transition-all duration-500`}
                      style={{ width: `${status.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
