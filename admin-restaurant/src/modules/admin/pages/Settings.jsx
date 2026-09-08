import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Save, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAdminProfile, updateAdminProfile, updateAdminPassword } from '../../../services/adminService';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pwdError, setPwdError] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: 'Super Admin',
  });

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : {
      emailAlerts: true,
      newOrderAlerts: true,
      newRestaurantAlerts: false,
    };
  });

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch Current Profile Data ពី API ពេលទំព័រត្រូវបាន Load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getAdminProfile();
        const userData = res.data.data || res.data; // ទាញយកទិន្នន័យតាមទម្រង់ Response របស់ Backend
        
        if (userData) {
          setProfile({
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'Super Admin',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfileError('Could not load your profile. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      setSubmitting(true);

      localStorage.setItem('admin_notifications', JSON.stringify(notifications));

      await updateAdminProfile({
        name: profile.name,
        email: profile.email,
      });

      showToast('Settings saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      setProfileError(error.response?.data?.message || error.response?.data?.error || 'Could not save your settings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }

    try {
      setPwdSubmitting(true);
      await updateAdminPassword({
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword,
        new_password_confirmation: passwords.confirmPassword, // required if the backend validates confirmation
      });

      showToast('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change failed:', error);
      setPwdError(error.response?.data?.message || error.response?.data?.error || 'Current password is incorrect, or something went wrong.');
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 size={24} className="animate-spin text-orange-600" />
        កំពុងទាញយកការកំណត់...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl p-4 sm:p-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl transition-all">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your system preferences and profile</p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {profileError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <User size={20} className="text-orange-600" />
              <h3 className="font-bold text-slate-900 text-base">Admin Profile</h3>
            </div>
            <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-600 font-semibold rounded-full">
              {profile.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Bell size={20} className="text-orange-600" />
            <h3 className="font-bold text-slate-900 text-base">Notifications Preference</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition">
              <span className="text-sm text-slate-700">Receive system email alerts</span>
              <span
                role="switch"
                aria-checked={notifications.emailAlerts}
                onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${notifications.emailAlerts ? 'bg-orange-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notifications.emailAlerts ? 'translate-x-4' : 'translate-x-1'}`} />
              </span>
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition">
              <span className="text-sm text-slate-700">Instant notification for new orders</span>
              <span
                role="switch"
                aria-checked={notifications.newOrderAlerts}
                onClick={() => setNotifications({ ...notifications, newOrderAlerts: !notifications.newOrderAlerts })}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${notifications.newOrderAlerts ? 'bg-orange-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notifications.newOrderAlerts ? 'translate-x-4' : 'translate-x-1'}`} />
              </span>
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition">
              <span className="text-sm text-slate-700">Alert when new restaurant registers</span>
              <span
                role="switch"
                aria-checked={notifications.newRestaurantAlerts}
                onClick={() => setNotifications({ ...notifications, newRestaurantAlerts: !notifications.newRestaurantAlerts })}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${notifications.newRestaurantAlerts ? 'bg-orange-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notifications.newRestaurantAlerts ? 'translate-x-4' : 'translate-x-1'}`} />
              </span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Preferences
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Shield size={20} className="text-orange-600" />
          <h3 className="font-bold text-slate-900 text-base">Security & Password</h3>
        </div>

        {pwdError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pwdSubmitting}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
          >
            {pwdSubmitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}