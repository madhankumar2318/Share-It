import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff, MapPin, Search, Loader2 } from 'lucide-react';
import { INDIAN_LOCATIONS } from '../data/indianLocations';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    pincode: '',
    state: 'Tamil Nadu',
    district: '',
    city: '',
    address: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pincode auto-lookup states
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState('');
  const [availablePostOffices, setAvailablePostOffices] = useState([]);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation checks
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  // Indian Postal API Auto-Lookup when 6 digits are entered
  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: pin }));
    setPincodeMessage('');
    setAvailablePostOffices([]);

    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await response.json();

        if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const poList = data[0].PostOffice;
          const firstPO = poList[0];

          // Auto-fill State and District directly from Indian Postal Database
          const apiState = firstPO.State || '';
          const matchedState = Object.keys(INDIAN_LOCATIONS).find(
            (s) => s.toLowerCase() === apiState.toLowerCase()
          ) || apiState || prev.state;

          const districtList = INDIAN_LOCATIONS[matchedState] || [];
          const apiDistrict = firstPO.District || '';
          const matchedDistrict = districtList.find(
            (d) => d.toLowerCase() === apiDistrict.toLowerCase()
          ) || apiDistrict || prev.district;

          setFormData((prev) => ({
            ...prev,
            state: matchedState,
            district: matchedDistrict,
            city: firstPO.Name || prev.city,
          }));

          setAvailablePostOffices(poList.map((po) => po.Name));
          setPincodeMessage(`✅ Verified: ${matchedDistrict}, ${matchedState}`);
        } else {
          setPincodeMessage('⚠️ Invalid Indian PIN code. Please check.');
        }
      } catch (err) {
        setPincodeMessage('⚠️ Could not verify PIN code online. You can choose manually.');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const defaultDistrict = INDIAN_LOCATIONS[selectedState]?.[0] || '';
    setFormData({
      ...formData,
      state: selectedState,
      district: defaultDistrict,
      city: '',
    });
  };

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
        registerPayload.phone = `+91 ${registerPayload.phone}`;
      }
      await register(registerPayload);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.details
        ? Object.values(err.response.data.details).join(', ')
        : (err.response?.data?.message || 'Registration failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const availableDistricts = INDIAN_LOCATIONS[formData.state] || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-xl w-full space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Join Share-It 🇮🇳</h2>
          <p className="text-sm text-gray-500">
            India's trusted community borrowing & lending network
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Madhan Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
              <div className="flex items-center rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden transition-all">
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 border-r border-gray-200 text-gray-700 text-xs font-bold select-none whitespace-nowrap flex-shrink-0">
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
                  className="w-full px-3 py-2.5 text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Enter 10-digit mobile number</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. madhan@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Indian Location Box with 6-Digit PIN Code Auto-Lookup */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Verified Community Location</span>
              </div>
              <span className="text-[10px] text-gray-400">Postal Auto-Detect</span>
            </div>

            {/* PIN Code Input with Auto-Lookup Indicator */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                6-Digit Indian PIN Code * (Auto-Fills City & State)
              </label>
              <div className="relative">
                <input
                  name="pincode"
                  type="text"
                  maxLength={6}
                  required
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="e.g. 641001 or 560001 or 600001"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none tracking-widest"
                />
                <div className="absolute right-3 top-2.5">
                  {pincodeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {pincodeMessage && (
                <p className={`text-[11px] mt-1 font-medium ${pincodeMessage.includes('✅') ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {pincodeMessage}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">State / UT *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {Object.keys(INDIAN_LOCATIONS).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">District / City *</label>
                <select
                  name="district"
                  required
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Choose District --</option>
                  {formData.district && !availableDistricts.includes(formData.district) && (
                    <option value={formData.district}>
                      {formData.district}
                    </option>
                  )}
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Town / Area / Locality</label>
                {availablePostOffices.length > 0 ? (
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Choose Locality --</option>
                    {availablePostOffices.map((po) => (
                      <option key={po} value={po}>
                        {po}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Gandhipuram or T. Nagar"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Street / House / Landmark</label>
                <input
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Flat 3B, 2nd Cross Street"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Password & Re-enter Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Re-enter Password *</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs focus:ring-2 outline-none ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Rule Checklist */}
          {formData.password && (
            <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-[11px] space-y-1.5">
              <span className="font-bold text-gray-700 block">Password Requirements:</span>
              <div className="grid grid-cols-2 gap-1 text-gray-600">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Number (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1 Special character (@$!%*?&)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch && formData.confirmPassword ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
