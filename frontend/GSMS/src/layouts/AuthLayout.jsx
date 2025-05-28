// src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';
import reactLogo from '../assets/react.svg';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <img
            className="mx-auto h-12 w-auto"
            src={reactLogo}
            alt="GSMS Logo"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Garment Stock Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Manage your inventory efficiently
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* The child route components (login, register, etc.) will be rendered here */}
            <Outlet />
          </div>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Garment SMS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;