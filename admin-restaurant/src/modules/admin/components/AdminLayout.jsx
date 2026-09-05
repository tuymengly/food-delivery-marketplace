import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { ChevronDown, Menu, Search, LogOut, User as UserIcon } from 'lucide-react';
import { getAdminProfile } from '../../../services/adminService'; 
import API from '../../../services/api';
import NotificationBell from '../../../components/ui/NotificationBell';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('admin_user') || localStorage.getItem('user');
    if (savedUser && savedUser !== "undefined") {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return { name: 'Admin', role: 'Super Admin' };
      }
    }
    return { name: 'Admin', role: 'Super Admin' };
  });

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const role = String(currentUser?.role || '').toLowerCase().trim();
    const isAdmin = ['admin', 'super_admin', 'super admin'].includes(role);

    if (!isAdmin) {
      navigate('/restaurant/dashboard', { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await getAdminProfile();
        const userData = response.data.data || response.data;
        if (userData) {
          setUser({
            name: userData.name || 'Admin',
            role: userData.role || 'Super Admin'
          });
          localStorage.setItem('admin_user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Failed to fetch admin profile from API:', error);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    API.post('/logout').catch((error) => {
      console.warn('Logout request failed; clearing local session anyway.', error);
    }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/admin/foods?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Dark Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed md:sticky top-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
 
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white border-b border-gray-100 sticky top-0 z-30 gap-2 md:gap-4">
          
          <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-md">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>

            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white text-xs md:text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e03a11] transition-all"
              />
            </div>
          </div>

          {/* User & Notification Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2 relative">
            <NotificationBell role="admin" />

            {/* Profile Info - អាចចុចបាន (Dropdown Menu) */}
            <div className="relative">
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer sm:pl-4 sm:border-l sm:border-gray-200 select-none py-1 px-2 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-9 h-9 bg-orange-100 text-[#e03a11] rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-bold text-gray-800 text-xs leading-tight">{user.name}</span>
                  <span className="text-[10px] text-gray-400 font-medium capitalize">{user.role}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 hidden sm:inline transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="font-bold text-gray-800 text-xs">{user.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); navigate('/admin/settings'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                  >
                    <UserIcon size={16} /> My Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 md:p-8 flex-1 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
