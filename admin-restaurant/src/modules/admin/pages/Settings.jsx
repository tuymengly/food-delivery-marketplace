import React, { useState } from 'react';
import { User, Bell, Shield, Save } from 'lucide-react';
export default function Settings() {
  const [profile, setProfile] = useState({
    name: 'Tom Wright',
    email: 'tom.wright@biterush.com',
    role: 'Super Admin',
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newOrderAlerts: true,
    newRestaurantAlerts: false,
  });
  const handleSave = (e) => {
    e.preventDefault();
    alert('ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!');
  };
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage your system preferences and profile</p>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <User size={20} className="text-gray-500" />
            <h3 className="font-bold text-gray-900 text-base">Admin Profile</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Bell size={20} className="text-gray-500" />
            <h3 className="font-bold text-gray-900 text-base">Notifications Preference</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">Receive system email alerts</span>
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#e03a11]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">Instant notification for new orders</span>
              <input
                type="checkbox"
                checked={notifications.newOrderAlerts}
                onChange={(e) => setNotifications({ ...notifications, newOrderAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#e03a11]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">Alert when new restaurant registers</span>
              <input
                type="checkbox"
                checked={notifications.newRestaurantAlerts}
                onChange={(e) => setNotifications({ ...notifications, newRestaurantAlerts: e.target.checked })}
                className="w-4 h-4 accent-[#e03a11]"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#e03a11] hover:bg-[#c6320e] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            <Save size={18} />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}