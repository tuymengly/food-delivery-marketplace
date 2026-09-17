import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Menu, LogOut, User as UserIcon } from 'lucide-react';
import API from "../../../services/api";
import NotificationBell from '../../../components/ui/NotificationBell';

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
        const response = await API.get('/user');
        const userProfile = response.data?.data?.user || response.data?.data || response.data;
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
    window.location.assign(`${import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174'}/login`);
  };

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-10 w-full shadow-sm">

      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-sm">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            placeholder="Search orders, deliveries..." 
            className="dashboard-input w-full pl-10 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell role="driver" />

        <div className="h-8 w-[1px] bg-slate-200" />

        {/* Profile Dropdown Container */}
        <div className="relative">
         <div 
  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
  className="flex items-center gap-3 cursor-pointer group py-1 px-2 rounded-xl hover:bg-slate-50 transition select-none"
>
  {userData?.profile_image ? (
    <img
      src={userData.profile_image}
      alt={userData?.name || 'Driver profile'}
      className="w-9 h-9 rounded-md object-cover shrink-0"
    />
  ) : (
    <div className="w-9 h-9 rounded-md bg-[#163A63] text-white font-bold flex items-center justify-center text-sm shrink-0">
      {userData?.name ? userData.name.charAt(0).toUpperCase() : 'D'}
    </div>
  )}
  <div className="hidden sm:block text-left leading-tight">
    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#2563EB] transition">
      {userData?.name || 'Driver Name'}
    </h4>
    <span className="text-[10px] text-slate-400 font-medium capitalize">
      {userData?.role || 'Driver'}
    </span>
  </div>
  <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
</div>

          {/* Profile Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-black-100  shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-black-100 sm:hidden">
                <p className="font-bold text-slate-800 text-xs">{userData?.name || 'Driver Name'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{userData?.role || 'Driver'}</p>
              </div>
              <button 
                onClick={() => { setIsProfileDropdownOpen(false); navigate('/driver/profile'); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition text-left"
              >
                <UserIcon size={16} /> My Profile
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition text-left"
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
