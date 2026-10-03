import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Share2, PlusCircle, LayoutDashboard, LogOut, LogIn, UserPlus } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-emerald-600 text-white p-2 rounded-xl group-hover:bg-emerald-700 transition">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">
              Share<span className="text-emerald-600">It</span>
            </span>
          </Link>

          {/* Links & Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-emerald-600 font-medium px-3 py-2 rounded-md transition text-sm"
            >
              Browse Items
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/add-item"
                  className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium px-3.5 py-2 rounded-lg transition text-sm border border-emerald-200"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  List an Item
                </Link>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-gray-700 hover:text-emerald-600 font-medium px-3 py-2 rounded-md transition text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-semibold text-gray-800">{user?.fullName}</span>
                    <span className="text-xs text-gray-500">{user?.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-gray-700 hover:text-emerald-600 font-medium px-4 py-2 rounded-lg transition text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
