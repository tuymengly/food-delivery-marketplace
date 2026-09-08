import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import API from '../services/api';

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

        // Clear role-specific profile data so a previous account cannot appear in the new panel.
        localStorage.removeItem('admin_user');
        localStorage.removeItem('restaurant_user');
        localStorage.removeItem('restaurant');
        localStorage.removeItem('restaurant_id');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (role === 'super_admin' || role === 'super admin' || role === 'admin') {
          localStorage.setItem('admin_user', JSON.stringify(user));
          navigate('/admin/dashboard'); 
        } else if (role === 'restaurant' || role === 'restaurant admin') {
          try {
            const profileResponse = await API.get('/restaurant/profile');
            const restaurant = profileResponse.data.data || profileResponse.data;
            if (restaurant?.id) {
              localStorage.setItem('restaurant_id', String(restaurant.id));
            }
          } catch (profileError) {
            console.warn('Restaurant profile could not be loaded after login:', profileError);
          }
          navigate('/restaurant/dashboard'); 
        } else if (role === 'driver' || role === 'rider') {
          navigate('/driver/dashboard');
        } else if (role === 'customer') {
          // Customers belong on the customer-facing app; hand off the
          // session via a one-time token instead of asking them to log in twice.
          window.location.assign(`${CUSTOMER_APP_URL}/home?token=${encodeURIComponent(token)}`);
        } else {
          setError('Access Denied: You do not have permission to access this portal.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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
    <main className="relative min-h-screen overflow-hidden bg-[#fff8f3] text-[#172033]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-red-200/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_rgba(117,51,20,0.16)] lg:min-h-[650px] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#ff5a00_0%,#f04416_58%,#ff3045_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-28 top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[#f04416] shadow-xl shadow-red-950/10">
                24
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-100">24 Hour Food</p>
              <h1 className="max-w-sm text-4xl font-black leading-tight xl:text-5xl">
                Everything your food business needs.
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-6 text-orange-50/90">
                Manage restaurants, menus and orders from one simple workspace.
              </p>
            </div>
            <div className="relative z-10 space-y-4 text-sm font-medium text-orange-50">
              <div className="flex items-center gap-3"><CheckCircle2 size={18} /> Restaurant management</div>
              <div className="flex items-center gap-3"><CheckCircle2 size={18} /> Live order tracking</div>
              <div className="flex items-center gap-3"><CheckCircle2 size={18} /> Secure staff access</div>
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff5a00,#ff3045)] text-lg font-black text-white shadow-lg shadow-orange-200">24</div>
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-[#e94b18]">24 Hour Food</p>
                  <p className="text-xs text-slate-400">Management Portal</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#f04416]">
                  <ChefHat size={25} strokeWidth={2.2} />
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f04416]">Welcome back</p>
                <h2 className="text-3xl font-black tracking-tight text-[#172033] sm:text-4xl">Sign in to continue</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">Access your dashboard and keep your food business moving.</p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label>
                  <div className="group relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#f04416]" />
                    <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f04416] focus:bg-white focus:ring-4 focus:ring-orange-100" />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                  <div className="group relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#f04416]" />
                    <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f04416] focus:bg-white focus:ring-4 focus:ring-orange-100" />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:text-[#f04416]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,#ff5a00,#ff3045)] text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <><Loader2 size={19} className="animate-spin" /><span>Signing in...</span></> : <><span>Sign in to dashboard</span><ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Want to list your restaurant?{' '}
                <Link to="/register" className="font-bold text-[#f04416] hover:underline">Register your restaurant</Link>
              </p>
              <p className="mt-2 text-center text-xs text-slate-400">
                Riders don't self-register — an admin creates rider accounts after the interview process.
              </p>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={16} className="text-emerald-500" /> Secure access for authorized staff
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
