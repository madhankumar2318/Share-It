import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation checks
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&#_~^+=.-]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Please make sure your password meets all the security requirements below.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your re-entered password.');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerPayload } = formData;
      if (registerPayload.phone && !registerPayload.phone.startsWith('+91')) {
        registerPayload.phone = `+91 ${registerPayload.phone.trim()}`;
      }
      await register(registerPayload);
      navigate('/');
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err.response?.data?.details) {
        msg = Object.values(err.response.data.details).join(', ');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (!err.response || err.response?.status === 404 || err.response?.status === 502) {
        msg = 'Backend server is waking up or deploying on Render. Please wait 30 seconds and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Join Share-It 🇮🇳</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create an account in seconds to borrow & lend in your community
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-2xl text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
            <input
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Madhan Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
            <div className="flex items-center rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden transition-all">
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700/60 border-r border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold select-none whitespace-nowrap flex-shrink-0">
                <span className="w-4 h-2.5 rounded-xs overflow-hidden flex flex-col border border-gray-300 flex-shrink-0 shadow-xs">
                  <span className="h-1/3 bg-[#FF9933] w-full block"></span>
                  <span className="h-1/3 bg-white w-full flex items-center justify-center block">
                    <span className="w-0.5 h-0.5 rounded-full bg-[#000080] block"></span>
                  </span>
                  <span className="h-1/3 bg-[#138808] w-full block"></span>
                </span>
                <span>+91</span>
              </div>
              <input
                name="phone"
                type="tel"
                required
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                value={formData.phone}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, phone: onlyNums });
                }}
                placeholder="9876543210"
                className="w-full px-3 py-2.5 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">10-digit mobile number for lender-borrower contact</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. madhan@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Password & Re-enter Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Password *</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Re-enter Password *</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs focus:ring-2 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 dark:border-slate-700 focus:ring-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Rule Checklist */}
          {formData.password && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-800 text-[11px] space-y-1.5">
              <span className="font-bold text-gray-700 dark:text-gray-300 block">Password Requirements:</span>
              <div className="grid grid-cols-2 gap-1 text-gray-600 dark:text-gray-400">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Symbol (@$!%*?&_)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch && formData.confirmPassword ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
