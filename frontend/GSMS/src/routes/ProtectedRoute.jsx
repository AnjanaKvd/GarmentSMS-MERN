// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If allowedRoles is provided, check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard with unauthorized message
    return <Navigate to="/dashboard?unauthorized=true" replace />;
  }

  // If authenticated and has correct role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;