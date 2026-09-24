import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import RestaurantSidebar from './RestaurantSidebar';
import { ChevronDown, Menu, X, Search, UtensilsCrossed, LogOut, User as UserIcon } from 'lucide-react';
import API from '../../../services/api';
import { getStoredUser, logout } from '../../../services/session';
import NotificationBell from '../../../components/ui/NotificationBell';

export default function RestaurantLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // The last user Laravel confirmed at startup (see App.jsx) - the session
  // cache is the only place this app reads a user from.
  const [user, setUser] = useState(() => getStoredUser() || { name: 'Restaurant', role: 'restaurant_owner' });
  const [restaurantStatus, setRestaurantStatus] = useState(null);

  useEffect(() => {
    const fetchRestaurantProfile = async () => {
      try {
        const response = await API.get('/restaurant/profile');
        const userData = response.data.data || response.data;
        if (userData) {
          if (userData.id) {
            // Cache used by the restaurant pages to scope their queries; it is
            // cleared on logout so it can't leak between owners.
            localStorage.setItem('restaurant_id', String(userData.id));
          }
          setUser((currentUser) => ({
            ...currentUser,
            name: userData.name || userData.restaurant_name || currentUser?.name || 'Restaurant',
            role: currentUser?.role || 'restaurant_owner',
          }));
          setRestaurantStatus(String(userData.status || '').toLowerCase());
        }
      } catch (error) {
        console.error('Failed to fetch restaurant profile:', error);
      }
    };

    fetchRestaurantProfile();
  }, []);

  // Logout: revoke the token in Laravel, drop every cached auth key (session
  // user, role, restaurant cache), then go back to the login page.
  const handleLogout = () => {
    logout();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/restaurant/foods?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="dashboard-shell flex min-h-screen relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-[#0B1F3B]/60 z-40 lg:hidden backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed lg:sticky top-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <RestaurantSidebar onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-2 px-4 lg:px-8 py-3 bg-white border-b border-[#D6DBE3] sticky top-0 z-30">
          
          {/* Mobile Menu Button & Search Bar */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-[#EEF2F8] shrink-0 transition"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Search Input */}
            <div className="relative w-full">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                type="text"
                placeholder="Search food, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="dashboard-input w-full pl-9 pr-4 py-2 border border-[#D6DBE3] text-xs sm:text-sm text-[#1A2233] focus:outline-none transition-all focus:border-[#0B1F3B]"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Live Order Counter Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FBEEEC] border border-[#F0D5CF] text-[#A6321E] text-xs font-bold">
              <UtensilsCrossed size={16} className="text-[#A6321E]" />
              <span>Live Orders</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell role="restaurant" />

            {/* Profile Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 cursor-pointer pl-2 sm:pl-4 border-l border-[#D6DBE3] py-1 px-2 hover:bg-[#EEF2F8] transition select-none"
              >
                <div className="w-9 h-9 bg-[#0B1F3B] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '🍔'}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-semibold text-[#1A2233] text-xs leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold capitalize">{user?.role}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 hidden sm:inline transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#D6DBE3] shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-[#D6DBE3] sm:hidden">
                    <p className="font-semibold text-[#1A2233] text-xs">{user?.name}</p>
                    <p className="text-[10px] text-emerald-600 capitalize">{user?.role}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); navigate('/restaurant/profile'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#1A2233] hover:bg-[#EEF2F8] transition cursor-pointer"
                  >
                    <UserIcon size={15} /> Restaurant Profile
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
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {restaurantStatus && restaurantStatus !== 'active' && (
            <div className="mb-4 flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              <span>
                {restaurantStatus === 'pending'
                  ? 'Your restaurant application is pending admin approval. You can preview your dashboard, but menu, category, and order management stay locked until an admin approves it.'
                  : `Your restaurant is currently ${restaurantStatus}. Contact an admin to restore access.`}
              </span>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}