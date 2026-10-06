import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocationFilter } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import LocationModal from './LocationModal';
import NotificationBell from './NotificationBell';
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
  ChevronDown,
  Menu,
  X,
  Compass,
  Sparkles,
  Settings,
  User,
  Globe2
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { selectedLocation, setIsModalOpen } = useLocationFilter();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  const isBrowse = location.pathname === '/';
  const isWishlist = location.pathname === '/wishlist';
  const isAddItem = location.pathname === '/add-item';
  const isDashboard = location.pathname === '/dashboard';
  const isSettings = location.pathname === '/settings';

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Location Pill */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                <div className="bg-emerald-600 text-white p-2 rounded-xl group-hover:bg-emerald-700 transition">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-gray-900 dark:text-white">
                  Share<span className="text-emerald-600">It</span>
                </span>
              </Link>

              {/* Location Pill */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-700 dark:text-gray-200 transition group shadow-2xs max-w-[140px] sm:max-w-[200px]"
                title="Filter items by location"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition flex-shrink-0" />
                <span className="truncate font-semibold text-[11px] sm:text-xs">
                  {selectedLocation?.type !== 'ALL' ? selectedLocation.label : t('allIndia')}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex-shrink-0" />
              </button>
            </div>

            {/* Desktop Navigation Links & Actions (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <Link
                to="/"
                className={`font-medium px-3 py-2 rounded-lg transition text-sm ${
                  isBrowse
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {t('browse')}
              </Link>

              <Link
                to="/wishlist"
                className={`font-medium px-3 py-2 rounded-lg transition text-sm ${
                  isWishlist
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {t('wishlist')}
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
                    {t('listAnItem')}
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
                    {t('dashboard')}
                  </Link>

                  {/* In-App Live Notification Bell */}
                  <NotificationBell />

                  {/* Dark / Light Mode Toggle */}
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

                  {/* 🌟 GitHub-Style Profile Dropdown Menu */}
                  <div className="relative pl-1 border-l border-gray-200 dark:border-slate-800" ref={profileDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 group"
                      aria-expanded={profileDropdownOpen}
                      aria-label="Open user profile menu"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-emerald-500/30 flex-shrink-0">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[110px] truncate hidden xl:inline">
                        {user?.fullName?.split(' ')[0] || 'Account'}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform duration-200 ${
                          profileDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu Container */}
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 divide-y divide-gray-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header: User Info */}
                        <div className="p-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-500/30 flex-shrink-0">
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {user?.fullName}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {user?.email}
                            </div>
                            {user?.neighborhood && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{user.neighborhood}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Navigation Links - Your Profile & Locality, App Language */}
                        <div className="p-1.5 space-y-0.5">
                          <Link
                            to="/settings?tab=profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                          >
                            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{t('yourProfile')}</span>
                          </Link>
                          <Link
                            to="/settings?tab=language"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                          >
                            <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{t('appLanguageOption')}</span>
                          </Link>
                        </div>

                        {/* Sign Out / Log Out Button */}
                        <div className="p-1.5 border-t border-gray-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t('logOut')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
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
                    className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium px-3.5 py-2 rounded-lg transition text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('logIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-xs transition text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t('signUp')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions: Notifications, Theme Toggle & Hamburger Button (Visible only on mobile) */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* In-App Live Notification Bell */}
              <NotificationBell />

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

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-xl">
            {/* Authenticated User Status Banner on Mobile */}
            {isAuthenticated && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {user?.fullName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex flex-col space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isBrowse
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('browse')}</span>
              </Link>

              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isWishlist
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('wishlist')}</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/add-item"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isAddItem
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('listAnItem')}</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isDashboard
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('dashboard')}</span>
                  </Link>

                  <Link
                    to="/settings?tab=profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isSettings && location.search !== '?tab=language'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('yourProfile')}</span>
                  </Link>

                  <Link
                    to="/settings?tab=language"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isSettings && location.search === '?tab=language'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('appLanguageOption')}</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Auth Actions */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logOut')}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('logIn')}</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{t('signUp')}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <LocationModal />
    </>
  );
};

export default Navbar;
