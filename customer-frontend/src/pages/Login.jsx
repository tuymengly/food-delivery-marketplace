import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getRoleRedirect, loginUser, saveAuthSession } from '../api/app';
import brandLogo from '../assets/icon/logo_no_bg.png';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user, token } = saveAuthSession(await loginUser(formData));
      // Notify navbar of auth change
      window.dispatchEvent(new Event('authChanged'));
      const redirect = getRoleRedirect(user?.role, token);
      redirect.startsWith('http')
        ? window.location.assign(redirect)
        : navigate(redirect);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20  rounded-md flex items-center justify-center mx-auto mb-4 shadow-sm p-2">
            <img src={brandLogo} alt="24-Hour Food logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B1F3A] mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600">Sign in to continue to Delish-Kh</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-md shadow-sm p-8 border border-[#D1D5DB]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-4 py-3 outline-none transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="app-input w-full pl-12 pr-12 py-3 outline-none transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="app-button-primary w-full py-3 font-bold text-lg disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#2563EB] hover:text-[#163A63] font-bold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/home" className="text-gray-600 hover:text-gray-900 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
