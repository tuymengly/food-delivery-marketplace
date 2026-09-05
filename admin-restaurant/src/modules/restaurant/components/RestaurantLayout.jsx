import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import RestaurantSidebar from './RestaurantSidebar';
import { ChevronDown, Menu, X, Search, UtensilsCrossed, LogOut, User as UserIcon } from 'lucide-react';
import API from '../../../services/api';
import NotificationBell from '../../../components/ui/NotificationBell';

export default function RestaurantLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('restaurant_user');
    if (savedUser && savedUser !== "undefined") {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return { name: 'Burger Joint', role: 'Restaurant' };
      }
    }
    return { name: 'Burger Joint', role: 'Restaurant' };
  });

  useEffect(() => {
    const fetchRestaurantProfile = async () => {
      try {
        const response = await API.get('/restaurant/profile'); 
        const userData = response.data.data || response.data;
        if (userData) {
          if (userData.id) {
            localStorage.setItem('restaurant_id', String(userData.id));
          }
          setUser({
            name: userData.name || userData.restaurant_name || 'Restaurant',
            role: userData.role || 'Restaurant'
          });
          localStorage.setItem('restaurant_user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Failed to fetch restaurant profile:', error);
      }
    };

    fetchRestaurantProfile();
  }, []);

  // មុខងារ Logout ចេញពីប្រព័ន្ធ Restaurant (លុបតែ Key របស់ខ្លួនឯង មិនប្រើ localStorage.clear() ទាំងអស់ទេ)
  const handleLogout = () => {
    API.post('/logout').catch((error) => {
      console.warn('Logout request failed; clearing local session anyway.', error);
    }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('restaurant_user');
      localStorage.removeItem('restaurant');
      localStorage.removeItem('restaurant_id');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/restaurant/foods?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`fixed lg:sticky top-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <RestaurantSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-2 px-4 lg:px-8 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          
          {/* Mobile Menu Button & Search Bar */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl shrink-0 transition"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Search Input */}
            <div className="relative w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search food, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 focus:bg-white text-xs sm:text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Live Order Counter Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
              <UtensilsCrossed size={16} className="animate-pulse" />
              <span>Live Orders</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell role="restaurant" />

            {/* Profile Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 cursor-pointer pl-2 sm:pl-4 border-l border-gray-200 py-1 px-2 rounded-xl hover:bg-gray-50 transition select-none"
              >
                <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '🍔'}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-bold text-gray-800 text-xs leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold capitalize">{user?.role}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 hidden sm:inline transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="font-bold text-gray-800 text-xs">{user?.name}</p>
                    <p className="text-[10px] text-emerald-600 capitalize">{user?.role}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); navigate('/restaurant/profile'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                  >
                    <UserIcon size={16} /> Restaurant Profile
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
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
