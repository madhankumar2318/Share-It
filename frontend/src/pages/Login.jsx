import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, CheckCircle2, Eye, EyeOff, RefreshCw, Zap } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const paramEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(paramEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [coldStartNotice, setColdStartNotice] = useState(false);
  const [retryAfterError, setRetryAfterError] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Proactively ping and wake up backend as soon as the Login page loads
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || '/api';
    fetch(`${backendUrl}/health`, { method: 'GET', keepalive: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (paramEmail && !email) {
      setEmail(paramEmail);
    }
  }, [paramEmail]);

  // Dynamic feedback if server cold-start takes longer than 3.5s
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setColdStartNotice(true);
      }, 3500);
    } else {
      setColdStartNotice(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError('');
    setRetryAfterError(false);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const isNetworkOrCold =
        err.response?.status === 502 ||
        err.response?.status === 503 ||
        err.response?.status === 504 ||
        err.code === 'ECONNABORTED' ||
        (!err.response && (err.message?.includes('Network Error') || err.message?.includes('timeout')));

      if (isNetworkOrCold) {
        setError('The server was sleeping on Render (free tier) and is now waking up. Please click "Sign In" again — it will connect right away!');
        setRetryAfterError(true);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
        setRetryAfterError(false);
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please verify your credentials.');
        setRetryAfterError(false);
      } else {
        setError('Network or server connection issue. Please check your internet connection and try again.');
        setRetryAfterError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xs border border-gray-100 dark:border-slate-800">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to start sharing and borrowing items in your community
          </p>
        </div>

        {registered && !error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs sm:text-sm font-medium shadow-xs">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Account created successfully! 🎉 Please sign in with your password to access your dashboard.</span>
          </div>
        )}

        {coldStartNotice && (
          <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 rounded-2xl text-xs sm:text-sm font-medium shadow-xs animate-pulse">
            <Zap className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Server is waking up from standby (Render free tier). Please keep this screen open, almost ready...</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs sm:text-sm space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {retryAfterError && (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Sign In Now
              </button>
            )}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1 rounded-lg"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? (coldStartNotice ? 'Waking up server & signing in...' : 'Signing in...') : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
