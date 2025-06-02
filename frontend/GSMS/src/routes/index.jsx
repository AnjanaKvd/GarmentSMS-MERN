import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import MaterialLedgerPage from '../pages/raw-materials/MaterialLedgerPage';
import RawMaterialsPage from '../pages/raw-materials/RawMaterialsPage';
import ProductsPage from '../pages/products/ProductsPage';
import ProductBOMPage from '../pages/products/ProductBOMPage';
import UserManagementPage from '../pages/users/UserManagementPage';
import Orders from '../pages/orders/Orders';
import Production from '../pages/production/Production';
import ReportsPage from '../pages/reports/ReportsPage';

// Protected route
import ProtectedRoute from './ProtectedRoute';

// Page Not Found
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
      <a href="/" className="mt-6 inline-block text-indigo-600 hover:text-indigo-500">
        Go back home
      </a>
    </div>
  </div>
);

// Placeholder components for future implementation
const ProductionPage = () => <div>Production Page</div>;

// Roles
const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  PRODUCTION: "PRODUCTION",
  VIEWER: "VIEWER"
};

const Routes = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const router = createBrowserRouter([
    {
      path: '/',
      element: isAuthenticated ? <DashboardLayout /> : <AuthLayout />,
      children: [
        {
          index: true,
          element: isAuthenticated ? <DashboardPage /> : <LoginPage />,
        },
      ],
    },
    {
      path: '/login',
      element: <AuthLayout />,
      children: [
        {
          index: true,
          element: <LoginPage />,
        },
      ],
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/dashboard',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <DashboardPage />,
            },
          ],
        },
        // All authenticated users can view these pages
        {
          path: '/raw-materials',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <RawMaterialsPage />,
            },
            {
              path: ':id/ledger',
              element: <MaterialLedgerPage />,
            },
          ],
        },
        {
          path: '/products',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <ProductsPage />,
            },
            {
              path: ':id/bom',
              element: <ProductBOMPage />,
            },
          ],
        },
        {
          path: '/orders',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <Orders />,
            },
          ],
        },
        {
          path: '/production',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <Production />,
            },
          ],
        },
        {
          path: '/reports',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <ReportsPage />,
            },
          ],
        },
      ],
    },
    // Admin-only routes
    {
      element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
      children: [
        {
          path: '/users',
          element: <DashboardLayout />,
          children: [
            {
              index: true,
              element: <UserManagementPage />,
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default Routes;
