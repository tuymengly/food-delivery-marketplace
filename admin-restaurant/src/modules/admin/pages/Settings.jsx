import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Save, Loader2, KeyRound } from 'lucide-react';
import { getAdminProfile, updateAdminProfile, updateAdminPassword } from '../../../services/adminService';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

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
        alert('មានបញ្ហាក្នុងการទាញយកទិន្នន័យ Profile!');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      localStorage.setItem('admin_notifications', JSON.stringify(notifications));

      await updateAdminProfile({
        name: profile.name,
        email: profile.email,
      });

      alert('ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!');
    } catch (error) {
      console.error('Save failed:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ!';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ!');
      return;
    }

    try {
      setPwdSubmitting(true);
      await updateAdminPassword({
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword,
        new_password_confirmation: passwords.confirmPassword, // បន្ថើមកន្លែងនេះបើ Backendទាមទារការផ្ទៀងផ្ទាត់
      });

      alert('ប្តូរពាក្យសម្ងាត់បានជោគជ័យ!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change failed:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវ ឬមានបញ្តហាកើតឡើង!';
      alert(msg);
    } finally {
      setPwdSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
        <Loader2 size={24} className="animate-spin text-[#e03a11]" />
        កំពុងទាញយកការកំណត់...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl p-4 sm:p-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your system preferences and profile</p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <User size={20} className="text-[#e03a11]" />
              <h3 className="font-bold text-gray-900 text-base">Admin Profile</h3>
            </div>
            <span className="text-xs px-2.5 py-1 bg-orange-100 text-[#e03a11] font-semibold rounded-full">
              {profile.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Bell size={20} className="text-[#e03a11]" />
            <h3 className="font-bold text-gray-900 text-base">Notifications Preference</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition">
              <span className="text-sm text-gray-700">Receive system email alerts</span>
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#e03a11] cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition">
              <span className="text-sm text-gray-700">Instant notification for new orders</span>
              <input
                type="checkbox"
                checked={notifications.newOrderAlerts}
                onChange={(e) => setNotifications({ ...notifications, newOrderAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#e03a11] cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition">
              <span className="text-sm text-gray-700">Alert when new restaurant registers</span>
              <input
                type="checkbox"
                checked={notifications.newRestaurantAlerts}
                onChange={(e) => setNotifications({ ...notifications, newRestaurantAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#e03a11] cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#e03a11] hover:bg-[#c6320e] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Preferences
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Shield size={20} className="text-[#e03a11]" />
          <h3 className="font-bold text-gray-900 text-base">Security & Password</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pwdSubmitting}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
          >
            {pwdSubmitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}