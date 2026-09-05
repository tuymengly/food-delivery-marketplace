import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import API from '../services/api'; 
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await API.post('/login', { email, password });
      const responseData = response.data.data || response.data;
      const token = responseData.token;
      const user = responseData.user;

      if (token) {
        if (!user || !user.role) {
          setError('Access Denied: User role is missing.');
          setLoading(false);
          return;
        }

        const role = user.role.toLowerCase().trim();

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (role === 'super_admin' || role === 'super admin' || role === 'admin') {
          navigate('/admin/dashboard'); 
        } else if (role === 'restaurant' || role === 'restaurant admin') {
          navigate('/restaurant/dashboard'); 
        } else if (role === 'driver' || role === 'rider') {
          navigate('/driver/dashboard'); 
        } else {
          setError('Access Denied: You do not have permission to access this portal.');
          localStorage.clear(); 
        }
      } else {
        setError('Login failed: Token not received.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-100 text-[#e03a11] rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-inner">
            24
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
          <p className="text-xs text-gray-400 mt-1">Sign in to manage your dashboard</p>
        </div>

        {/* Error Message Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white text-xs md:text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e03a11] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white text-xs md:text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e03a11] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#e03a11] hover:bg-orange-700 text-white font-semibold rounded-xl text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}