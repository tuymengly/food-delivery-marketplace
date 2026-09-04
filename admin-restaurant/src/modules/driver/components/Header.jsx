import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Menu, LogOut, User as UserIcon } from 'lucide-react';
import API from "../../../services/api";

export default function Header({ 
  setIsSidebarOpen, 
  searchTerm, 
  setSearchTerm, 
  user: propsUser 
}) {
  const [userData, setUserData] = useState(() => {
    if (propsUser) return propsUser;
    const localUser = localStorage.getItem('user');
    return localUser ? JSON.parse(localUser) : { name: 'Driver', role: 'Driver' };
  });
  
  const [loading, setLoading] = useState(!propsUser);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (propsUser) {
      setUserData(propsUser);
      return;
    }

    const fetchDriverProfile = async () => {
      try {
        setLoading(true);
        const response = await API.get('/driver/profile'); 
        const userProfile = response.data?.data || response.data;
        if (userProfile) {
          setUserData(userProfile);
          localStorage.setItem('user', JSON.stringify(userProfile));
        }
      } catch (error) {
        console.error('Failed to fetch driver profile in header:', error);
        const localUser = localStorage.getItem('user');
        if (localUser) {
          setUserData(JSON.parse(localUser));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDriverProfile();
  }, [propsUser]);

  // មុខងារសម្រាប់ Logout ចេញពីប្រព័ន្ធ
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-10 w-full shadow-sm">

      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-sm">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            placeholder="Search orders, deliveries..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50/60 border border-gray-200/80 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 transition">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-8 w-[1px] bg-gray-200" />

        {/* Profile Dropdown Container */}
        <div className="relative">
          <div 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer group py-1 px-2 rounded-xl hover:bg-gray-50 transition select-none"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 text-[#e03a11] font-bold flex items-center justify-center text-sm">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-orange-600 transition">
                {userData?.name || 'Driver Name'}
              </h4>
              <span className="text-[10px] text-gray-400 font-medium capitalize">
                {userData?.role || 'Driver'}
              </span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Profile Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                <p className="font-bold text-gray-800 text-xs">{userData?.name || 'Driver Name'}</p>
                <p className="text-[10px] text-gray-400 capitalize">{userData?.role || 'Driver'}</p>
              </div>
              <button 
                onClick={() => { setIsProfileDropdownOpen(false); navigate('/driver/profile'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition text-left"
              >
                <UserIcon size={16} /> My Profile
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition text-left"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}