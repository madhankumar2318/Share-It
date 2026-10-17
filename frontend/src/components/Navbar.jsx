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
  Compass,
  Sparkles,
  User,
  Globe2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { installPwa } from '../utils/pwaInstaller';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { selectedLocation, setIsModalOpen } = useLocationFilter();
  const { t } = useLanguage();
  const toast = useToast();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const mobileProfileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on page navigation
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click or tap
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop = !profileDropdownRef.current || !profileDropdownRef.current.contains(event.target);
      const isOutsideMobile = !mobileProfileDropdownRef.current || !mobileProfileDropdownRef.current.contains(event.target);
      if (isOutsideDesktop && isOutsideMobile) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  const isBrowse = location.pathname === '/';
  const isWishlist = location.pathname === '/wishlist';
  const isAddItem = location.pathname === '/add-item';
  const isDashboard = location.pathname === '/dashboard';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // 🌟 Unified 4-Option Profile Dropdown Menu (Matches Image 1)
  const renderProfileMenu = (onClose) => (
    <div className="absolute right-0 mt-2.5 w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 divide-y divide-gray-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
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
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {user?.fullName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.email}
          </div>
          {user?.neighborhood && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{user.neighborhood}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Menu Options */}
      <div className="p-1.5 space-y-0.5">
        {/* 1. Your Profile & Locality */}
        <Link
          to="/settings?tab=profile"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{t('yourProfile')}</span>
        </Link>

        {/* 2. App Language & Region */}
        <Link
          to="/settings?tab=language"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{t('appLanguageOption')}</span>
        </Link>

        {/* 3. Security & Account */}
        <Link
          to="/settings?tab=security"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{t('securityOption')}</span>
        </Link>

        {/* 4. Install Share-It App */}
        <button
          type="button"
          onClick={() => {
            onClose();
            installPwa(toast);
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300 transition text-left group"
        >
          <span className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Install Share-It App</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[9px] uppercase tracking-wide">
            APP
          </span>
        </button>
      </div>

      {/* Log Out */}
      <div className="p-1.5 border-t border-gray-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t('logOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-2 sm:gap-4">
            {/* Logo & Location Pill - Left Side */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
              <Link to="/" className="flex items-center gap-1.5 group flex-shrink-0">
                <div className="bg-emerald-600 text-white p-1.5 sm:p-2 rounded-xl group-hover:bg-emerald-700 transition">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-gray-900 dark:text-white">
                  Share<span className="text-emerald-600">It</span>
                </span>
              </Link>

              {/* Location Pill - Compact on mobile so it never collides with notification bell */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-700 dark:text-gray-200 transition group shadow-2xs max-w-[90px] xs:max-w-[115px] sm:max-w-[190px] min-w-0"
                title="Filter items by location"
              >
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition flex-shrink-0" />
                <span className="truncate font-semibold text-[10px] sm:text-xs">
                  {selectedLocation?.type !== 'ALL' ? selectedLocation.label : t('allIndia')}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex-shrink-0" />
              </button>
            </div>

            {/* Desktop Navigation Links & Actions (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              {!isAuthPage && (
                <>
                  <Link
                    to="/"
                    className={`inline-flex items-center gap-1.5 font-medium px-3.5 py-2 rounded-lg transition text-sm ${
                      isBrowse
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <Compass className={`w-4 h-4 ${isBrowse ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span>{t('browse')}</span>
                  </Link>

                  <Link
                    to="/wishlist"
                    className={`inline-flex items-center gap-1.5 font-medium px-3.5 py-2 rounded-lg transition text-sm ${
                      isWishlist
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs'
                        : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${isWishlist ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span>{t('wishlist')}</span>
                  </Link>
                </>
              )}

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

                  {/* 🌟 Desktop User Badge & Dropdown */}
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

                    {/* Desktop Dropdown Menu Container */}
                    {profileDropdownOpen && renderProfileMenu(() => setProfileDropdownOpen(false))}
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

                  {location.pathname !== '/login' && (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium px-3.5 py-2 rounded-lg transition text-sm"
                    >
                      <LogIn className="w-4 h-4" />
                      {t('logIn')}
                    </Link>
                  )}
                  {location.pathname !== '/register' && (
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-xs transition text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      {t('signUp')}
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Actions: Notifications, Theme Toggle & M-Letter Profile Dropdown (Shifted comfortably away from edges) */}
            <div className="flex md:hidden items-center gap-2 flex-shrink-0 pr-1">
              {/* In-App Live Notification Bell (Hidden on Login & Sign Up pages) */}
              {!isAuthPage && <NotificationBell />}

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
                className="p-1.5 sm:p-2 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {/* 🌟 Mobile M-Letter User Profile Badge & Dropdown (When Logged In) */}
              {isAuthenticated && !isAuthPage && (
                <div className="relative" ref={mobileProfileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1 p-0.5 pl-0.5 pr-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    aria-expanded={profileDropdownOpen}
                    aria-label="Open user profile menu"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-xs shadow-xs border border-emerald-500/40 flex-shrink-0">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                        profileDropdownOpen ? 'rotate-180 text-emerald-500' : ''
                      }`}
                    />
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {profileDropdownOpen && renderProfileMenu(() => setProfileDropdownOpen(false))}
                </div>
              )}

              {/* Unauthenticated Quick Action on Mobile */}
              {!isAuthenticated && !isAuthPage && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded-xl text-xs shadow-xs transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('logIn')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sleek Mobile Bottom Navigation Bar (Hidden on auth pages, Perfectly Aligned Horizontal & Vertical Baselines) */}
      {!isAuthPage && (
        <nav
          aria-label="Mobile Navigation Bar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        >
          <div className={`grid ${isAuthenticated ? 'grid-cols-4' : 'grid-cols-3'} items-center h-14 max-w-md mx-auto`}>
            {/* 1. Browse */}
            <Link
              to="/"
              className={`flex flex-col items-center justify-center h-full transition ${
                isBrowse
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <div className="h-6 flex items-center justify-center">
                <Compass className={`w-5 h-5 ${isBrowse ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium leading-none">{t('browse')}</span>
            </Link>

            {/* 2. Wishlist */}
            <Link
              to="/wishlist"
              className={`flex flex-col items-center justify-center h-full transition ${
                isWishlist
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <div className="h-6 flex items-center justify-center">
                <Sparkles className={`w-5 h-5 ${isWishlist ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium leading-none">{t('wishlist')}</span>
            </Link>

            {/* 3. List an Item - Symmetrical, vertically and horizontally centered with identical text baseline */}
            {isAuthenticated && (
              <Link
                to="/add-item"
                className={`flex flex-col items-center justify-center h-full transition group ${
                  isAddItem
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <div className="h-6 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    isAddItem
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}>
                    <PlusCircle className="w-4 h-4 stroke-[2.4]" />
                  </div>
                </div>
                <span className="text-[10px] mt-1 tracking-tight font-semibold leading-none">{t('listAnItem')}</span>
              </Link>
            )}

            {/* 4. Dashboard (when authenticated) OR Log In (when not) */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className={`flex flex-col items-center justify-center h-full transition ${
                  isDashboard
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <div className="h-6 flex items-center justify-center">
                  <LayoutDashboard className={`w-5 h-5 ${isDashboard ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="text-[10px] mt-1 tracking-tight font-medium leading-none">{t('dashboard')}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              >
                <div className="h-6 flex items-center justify-center">
                  <LogIn className="w-5 h-5 stroke-[1.8]" />
                </div>
                <span className="text-[10px] mt-1 tracking-tight font-medium leading-none">{t('logIn')}</span>
              </Link>
            )}
          </div>
        </nav>
      )}

      <LocationModal />
    </>
  );
};

export default Navbar;
