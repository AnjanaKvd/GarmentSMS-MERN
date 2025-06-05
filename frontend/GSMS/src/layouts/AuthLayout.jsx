// src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';
import logo from '../assets/logo.png';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <img
            className="mx-auto pt-2 h-12 w-auto"
            src={logo}
            alt="GSMS Logo"
          />
        </div>
        
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* The child route components (login, register, etc.) will be rendered here */}
            <Outlet />
          </div>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;