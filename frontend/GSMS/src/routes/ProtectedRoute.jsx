// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserFromToken } from '../redux/slices/authSlice';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Get user from token
  const user = getUserFromToken(token);
  
  // If allowedRoles is provided, check if user has the required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard with unauthorized message
    return <Navigate to="/dashboard?unauthorized=true" replace />;
  }

  // If authenticated and has correct role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;