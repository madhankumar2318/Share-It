import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';

// Route Lazy Loading for minimal initial JavaScript bundle size
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ItemDetail = lazy(() => import('./pages/ItemDetail'));
const AddItem = lazy(() => import('./pages/AddItem'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CommunityWishlist = lazy(() => import('./pages/CommunityWishlist'));
const Settings = lazy(() => import('./pages/Settings'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
    <span className="text-xs text-slate-400 font-medium tracking-wide">Loading page...</span>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <PageFallback />;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <LocationProvider>
            <ToastProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
                <Navbar />
                <main className="flex-1">
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/wishlist" element={<CommunityWishlist />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/items/:id" element={<ItemDetail />} />

                      {/* Protected Routes */}
                      <Route
                        path="/add-item"
                        element={
                          <ProtectedRoute>
                            <AddItem />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </Router>
          </ToastProvider>
        </LocationProvider>
      </LanguageProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
