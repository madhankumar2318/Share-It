import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocationFilter } from '../context/LocationContext';
import LocationModal from './LocationModal';
import { 
  Share2, 
  PlusCircle, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sun, 
  Moon, 
  MapPin, 
  ChevronDown 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { selectedLocation, setIsModalOpen } = useLocationFilter();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isBrowse = location.pathname === '/';
  const isWishlist = location.pathname === '/wishlist';
  const isAddItem = location.pathname === '/add-item';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Location Pill */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-emerald-600 text-white p-2 rounded-xl group-hover:bg-emerald-700 transition">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 dark:text-white">
                  Share<span className="text-emerald-600">It</span>
                </span>
              </Link>

              {/* Location Pill */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-700 dark:text-gray-200 transition group shadow-2xs"
                title="Filter items by location"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition flex-shrink-0" />
                <span className="max-w-[100px] sm:max-w-[170px] truncate font-semibold">
                  {selectedLocation?.type !== 'ALL' ? selectedLocation.label : 'All India'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex-shrink-0" />
              </button>
            </div>

            {/* Links & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className={`font-medium px-3 py-2 rounded-lg transition text-sm ${
                isBrowse
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Browse
            </Link>

            <Link
              to="/wishlist"
              className={`font-medium px-3 py-2 rounded-lg transition text-sm ${
                isWishlist
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              Wishlist 🙋
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/add-item"
                  className={`inline-flex items-center gap-1.5 font-medium px-3.5 py-2 rounded-lg transition text-sm ${
                    isAddItem
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <PlusCircle className={`w-4 h-4 ${isAddItem ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`} />
                  List an Item
                </Link>

                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-1.5 font-medium px-3.5 py-2 rounded-lg transition text-sm ${
                    isDashboard
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 ${isDashboard ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`} />
                  Dashboard
                </Link>

                {/* Dark / Light Mode Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle theme"
                  className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-slate-800">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.fullName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Dark / Light Mode Toggle Button for guest */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle theme"
                  className="p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium px-4 py-2 rounded-lg transition text-sm"
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
      <LocationModal />
    </>
  );
};

export default Navbar;
