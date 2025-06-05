// src/layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useEffect } from 'react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Debug user role and auth state
  console.log('User in DashboardLayout:', user);
  console.log('Is authenticated:', isAuthenticated);
  
  // Define role-based permissions
  const isAdmin = user?.role === 'ADMIN';
  const isManagerOrAdmin = ['ADMIN', 'MANAGER'].includes(user?.role);
  const isProductionOrHigher = ['ADMIN', 'MANAGER', 'PRODUCTION'].includes(user?.role);
  const isViewer = user?.role === 'VIEWER';

  console.log('Role checks:', { isAdmin, isManagerOrAdmin, isProductionOrHigher, isViewer });

  // Define navigation items with role-based access control
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, allowed: true },
    { name: 'Raw Materials', href: '/raw-materials', icon: CubeIcon, allowed: true },
    { name: 'Products & BOM', href: '/products', icon: ShoppingBagIcon, allowed: true },
    { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon, allowed: isManagerOrAdmin || isProductionOrHigher },
    { name: 'Production', href: '/production', icon: DocumentTextIcon, allowed: isProductionOrHigher },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon, allowed: isManagerOrAdmin || isProductionOrHigher || isViewer},
    { name: 'Users', href: '/users', icon: UserIcon, allowed: isAdmin },
  ];

  console.log('Navigation items after definition:', navigation);
  console.log('Filtered navigation items:', navigation.filter(item => item.allowed));

  const handleLogout = () => {
    // Dispatch logout action
    dispatch(logout());
    // Redirect to login
    navigate('/login');
  };
  
  // Get role display name
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'production': return 'Production Staff';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } fixed inset-0 flex z-40 md:hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center px-4">
            <span className="text-xl font-bold text-white">GSMS</span>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.filter(item => item.allowed).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-white hover:bg-gray-700"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className="mr-4 h-6 w-6 text-gray-300"
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-800">
              <span className="text-xl font-bold text-white">GSMS</span>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 bg-gray-800 space-y-1">
                {navigation.filter(item => item.allowed).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                  >
                    <item.icon
                      className="mr-3 h-6 w-6 text-gray-300"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-gray-900 self-center">
                Garment Stock Management
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification bell */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{user?.username || 'User'}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      {getRoleDisplayName(user?.role)}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Replace with your content */}
              <Outlet />
              {/* /End replace */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;