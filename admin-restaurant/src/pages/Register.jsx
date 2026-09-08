import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ChefHat,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import API from '../services/api';

// Public registration only ever creates a restaurant-owner application here.
// Rider accounts cannot be self-registered — an admin creates them manually
// after an off-platform interview (see ManageDrivers "Add New Driver").
export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    restaurant_name: '',
    restaurant_address: '',
    restaurant_phone: '',
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      role: 'restaurant',
      restaurant_name: formData.restaurant_name,
      restaurant_address: formData.restaurant_address,
      restaurant_phone: formData.restaurant_phone,
    };

    setLoading(true);
    try {
      const response = await API.post('/register', payload);
      const responseData = response.data.data || response.data;
      const { token, user } = responseData;

      localStorage.removeItem('admin_user');
      localStorage.removeItem('restaurant_user');
      localStorage.removeItem('restaurant');
      localStorage.removeItem('restaurant_id');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/restaurant/dashboard');
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      setError(
        validationErrors
          ? Object.values(validationErrors).flat().join(' ')
          : err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8f3] text-[#172033]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-red-200/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center justify-center p-4 py-10 sm:p-6 lg:p-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_rgba(117,51,20,0.16)] lg:min-h-[720px] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#ff5a00_0%,#f04416_58%,#ff3045_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div className="absolute -right-28 top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[#f04416] shadow-xl shadow-red-950/10">
                24
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-orange-100">Become a partner</p>
              <h1 className="max-w-sm text-4xl font-black leading-tight xl:text-5xl">
                Grow your business with us.
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-6 text-orange-50/90">
                List your restaurant and manage your menu. An admin reviews every application before it goes live.
              </p>
            </div>
            <div className="relative z-10 space-y-4 text-sm font-medium text-orange-50">
              <div className="flex items-center gap-3"><ShieldCheck size={18} /> Reviewed by our admin team</div>
              <div className="flex items-center gap-3"><ShieldCheck size={18} /> One account, one dashboard</div>
              <div className="flex items-center gap-3"><ShieldCheck size={18} /> Start managing once approved</div>
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#f04416]">
                  <ChefHat size={25} strokeWidth={2.2} />
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f04416]">Register your restaurant</p>
                <h2 className="text-3xl font-black tracking-tight text-[#172033] sm:text-4xl">Create your account</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Your account is created immediately; an admin will review and approve your restaurant before it goes live.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="mb-2 block text-sm font-bold text-slate-700">Full name</label>
                  <div className="group relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f04416]" />
                    <input id="reg-name" type="text" required value={formData.name} onChange={handleChange('name')} placeholder="Your full name" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f04416] focus:bg-white focus:ring-4 focus:ring-orange-100" />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label>
                  <div className="group relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f04416]" />
                    <input id="reg-email" type="email" required value={formData.email} onChange={handleChange('email')} placeholder="you@example.com" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f04416] focus:bg-white focus:ring-4 focus:ring-orange-100" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-password" className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                    <div className="group relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f04416]" />
                      <input id="reg-password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange('password')} placeholder="Min. 8 characters" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f04416] focus:bg-white focus:ring-4 focus:ring-orange-100" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-[#f04416]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-password-confirm" className="mb-2 block text-sm font-bold text-slate-700">Confirm password</label>
                    <input id="reg-password-confirm" type={showPassword ? 'text' : 'password'} required value={formData.password_confirmation} onChange={handleChange('password_confirmation')} placeholder="Re-enter password" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f04416] focus:bg-white focus:ring-4 focus:ring-orange-100" />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <div>
                    <label htmlFor="reg-restaurant-name" className="mb-2 block text-sm font-bold text-slate-700">Restaurant name</label>
                    <div className="group relative">
                      <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f04416]" />
                      <input id="reg-restaurant-name" type="text" required value={formData.restaurant_name} onChange={handleChange('restaurant_name')} placeholder="e.g. Tasty Bites" className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#f04416] focus:ring-4 focus:ring-orange-100" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-restaurant-address" className="mb-2 block text-sm font-bold text-slate-700">Restaurant address</label>
                    <div className="group relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f04416]" />
                      <input id="reg-restaurant-address" type="text" required value={formData.restaurant_address} onChange={handleChange('restaurant_address')} placeholder="Street address" className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#f04416] focus:ring-4 focus:ring-orange-100" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-restaurant-phone" className="mb-2 block text-sm font-bold text-slate-700">Restaurant phone</label>
                    <div className="group relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f04416]" />
                      <input id="reg-restaurant-phone" type="tel" required value={formData.restaurant_phone} onChange={handleChange('restaurant_phone')} placeholder="012 345 678" className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#f04416] focus:ring-4 focus:ring-orange-100" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,#ff5a00,#ff3045)] text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <><Loader2 size={19} className="animate-spin" /><span>Creating account...</span></> : <><span>Create account</span><ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#f04416] hover:underline">Sign in</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
