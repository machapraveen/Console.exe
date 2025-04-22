// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Console.ext</span>
            </Link>
            {user && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Dashboard
                </Link>
                <Link to="/applications" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Applications
                </Link>
                <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Settings
                </Link>
              </div>
            )}
          </div>
          {user ? (
            <div className="flex items-center">
              <span className="mr-4">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-3 py-2 rounded-md text-sm font-medium bg-white text-indigo-600 hover:bg-gray-100"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;