import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../redux/slices/dashboardSlice';
import {
  CubeIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Widget Components
import StatCard from './widgets/StatCard';
import RecentActivityTable from './widgets/RecentActivityTable';
import ProductList from './widgets/ProductList';
import StatusOverview from './widgets/StatusOverview';
import ChartWidget from './widgets/ChartWidget';

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

  // Sample data for status overview
  const orderStatusItems = [
    { label: 'Completed', percentage: 65, color: 'bg-green-500' },
    { label: 'In Progress', percentage: 25, color: 'bg-yellow-500' },
    { label: 'Pending', percentage: 10, color: 'bg-red-500' },
  ];

  // Column definitions for recent entries table
  const materialColumns = [
    { key: 'material', label: 'Material' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'date', label: 'Date' },
  ];

  // Column definitions for recent production table
  const productionColumns = [
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your Garment Stock Management System
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Raw Materials"
          value={stats.totalRawMaterials}
          icon={<CubeIcon className="h-6 w-6 text-white" />}
          color="indigo"
        />
        <StatCard
          title="In-Stock Balance"
          value={stats.inStockBalance}
          icon={<ScaleIcon className="h-6 w-6 text-white" />}
          color="green"
          suffix="meters"
        />
        <StatCard
          title="Active POs"
          value={stats.activePurchaseOrders}
          icon={<ClipboardDocumentListIcon className="h-6 w-6 text-white" />}
          color="yellow"
        />
        <StatCard
          title="Upcoming Deliveries"
          value={stats.upcomingDeliveries}
          icon={<TruckIcon className="h-6 w-6 text-white" />}
          color="red"
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Material Entries */}
          <RecentActivityTable
            title="Recent Material Entries"
            data={stats.recentEntries}
            columns={materialColumns}
          />
          
          {/* Recent Production Activities */}
          <RecentActivityTable
            title="Recent Production Activities"
            data={stats.recentProduction}
            columns={productionColumns}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Top Products */}
          <ProductList products={stats.topProducts} />
          
          {/* Order Status Overview */}
          <StatusOverview 
            title="Order Status Overview" 
            items={orderStatusItems} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
