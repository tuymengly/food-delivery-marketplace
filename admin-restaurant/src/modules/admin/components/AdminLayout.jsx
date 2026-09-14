import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const pageTitle = {
    '/admin/dashboard': 'Dashboard',
    '/admin/users': 'Users',
    '/admin/restaurants': 'Restaurants',
    '/admin/drivers': 'Riders',
    '/admin/categories': 'Categories',
    '/admin/foods': 'Menu & Foods',
    '/admin/orders': 'Order monitoring',
    '/admin/payments': 'Finance',
    '/admin/reviews': 'Reviews',
    '/admin/help-center': 'Support',
    '/admin/settings': 'Settings',
    '/admin/profile': 'Profile',
  }[location.pathname] || 'Admin Panel';

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('admin_user') || localStorage.getItem('user');
    if (savedUser && savedUser !== "undefined") {
      try {
        return JSON.parse(savedUser);
      } catch {
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
          setUser((currentUser) => ({
            ...currentUser,
            ...userData,
            name: userData.name || currentUser.name || 'Admin',
            role: userData.role || currentUser.role || 'Super Admin',
          }));
          localStorage.setItem('admin_user', JSON.stringify(userData));
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Failed to fetch admin profile from API:', error);
      }
    };

    fetchProfile();

    const handleProfileUpdated = (event) => {
      if (event.detail) {
        setUser((currentUser) => ({ ...currentUser, ...event.detail }));
      }
    };

    window.addEventListener('admin-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdated);
  }, [navigate]);

  const handleLogout = () => {
    API.post('/logout').catch((error) => {
      console.warn('Logout request failed; clearing local session anyway.', error);
    }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('user');
      window.location.assign(`${import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174'}/login`);
    });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/admin/foods?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="dashboard-shell flex min-h-screen relative">
      {/* Dark Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-[#0B1F3B]/50 backdrop-blur-[2px] z-40 md:hidden transition-opacity"
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
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white border-b border-[#D6DBE3] sticky top-0 z-30 gap-2 md:gap-4">
          
          <div className="flex items-center gap-2 md:gap-5 flex-1 max-w-xl">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-[#EEF2F8] shrink-0"
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>

            <div className="relative w-full">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="dashboard-input w-full pl-9 pr-3 py-2 border border-[#D6DBE3] text-xs md:text-sm text-[#1A2233] focus:outline-none transition-all focus:border-[#0B1F3B]"
              />
            </div>
            <h1 className="hidden md:block shrink-0 text-lg font-bold text-[#0B1F3B]">{pageTitle}</h1>
          </div>

          {/* User & Notification Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2 relative">
            <NotificationBell role="admin" />

            {/* Profile Info - អាចចុចបាន (Dropdown Menu) */}
            <div className="relative">
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer sm:pl-4 sm:border-l sm:border-[#D6DBE3] select-none py-1 px-2 hover:bg-[#EEF2F8] transition"
              >
                {user.profile_image || user.avatar ? (
                  <img src={user.profile_image || user.avatar} alt="Admin profile" className="w-9 h-9 object-cover border border-[#D6DBE3] shrink-0" />
                ) : (
                  <div className="w-9 h-9 bg-[#0B1F3B] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="hidden sm:flex flex-col">
                  <span className="font-semibold text-[#1A2233] text-xs leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">{user.role}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 hidden sm:inline transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#D6DBE3] shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-[#D6DBE3] sm:hidden">
                    <p className="font-semibold text-[#1A2233] text-xs">{user.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); navigate('/admin/profile'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#1A2233] hover:bg-[#EEF2F8] transition cursor-pointer"
                  >
                    <UserIcon size={15} /> Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#A6321E] hover:bg-[#FBEEEC] transition cursor-pointer"
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dynamic Page Content */}
        <main className="dashboard-content admin-content p-4 md:p-8 flex-1 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}