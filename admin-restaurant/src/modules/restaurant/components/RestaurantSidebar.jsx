import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  FolderTree, 
  DollarSign, 
  Star, 
  User, 
  ExternalLink, 
  HelpCircle, 
  LogOut,
  Pencil,
  X
} from 'lucide-react';

import logoImg from '../../../assets/Logo Upgrade (No Background).png';
import API from '../../../services/api';

const resolveImageUrl = (image) => {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return `http://127.0.0.1:8000/storage/${image}`;
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

export default function RestaurantSidebar({ onClose, onLogout }) {
  const [restaurantData, setRestaurantData] = useState({
    name: '24 HOUR FOOD',
    image: null,
    isOpen: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const applyRestaurantInfo = (parsedData) => {
      if (!parsedData) return;
      setImageFailed(false);
      setRestaurantData({
        name: parsedData.name || '24 HOUR FOOD',
        image: resolveImageUrl(parsedData.image),
        isOpen: parsedData.status === 'active' || parsedData.is_open === true,
      });
    };

    const loadRestaurantInfo = async () => {
      try {
        const response = await API.get('/restaurant/profile');
        const profile = response.data.data || response.data;
        if (profile?.id) {
          localStorage.setItem('restaurant', JSON.stringify(profile));
          localStorage.setItem('restaurant_id', String(profile.id));
        }
        applyRestaurantInfo(profile);
        return;
      } catch (error) {
        console.warn('Could not load restaurant profile for sidebar:', error);
      } finally {
        setIsLoading(false);
      }

      try {
        const storedRestaurant = localStorage.getItem('restaurant');
        if (storedRestaurant) {
          applyRestaurantInfo(JSON.parse(storedRestaurant));
        } else {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.restaurant) {
              applyRestaurantInfo(user.restaurant);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load restaurant info from localStorage:', error);
      }
    };

    void loadRestaurantInfo();
    window.addEventListener('restaurantUpdated', loadRestaurantInfo);
    return () => window.removeEventListener('restaurantUpdated', loadRestaurantInfo);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/restaurant/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/restaurant/orders', icon: ShoppingBag },
    { name: 'Manage Foods', path: '/restaurant/foods', icon: UtensilsCrossed },
    { name: 'Categories', path: '/restaurant/categories', icon: FolderTree },
    { name: 'Sales & Earnings', path: '/restaurant/sales', icon: DollarSign },
    { name: 'Reviews', path: '/restaurant/reviews', icon: Star },
    { name: 'Profile / Settings', path: '/restaurant/profile', icon: User },
  ];

  const showImage = restaurantData.image && !imageFailed;

  return (
    <aside className="dashboard-sidebar w-64 text-white flex flex-col justify-between p-4 h-full overflow-y-auto">
      <div>
        <div className="relative mb-6 pt-2 pb-4 border-b border-white/10">
          <button 
            onClick={onClose}
            className="lg:hidden absolute right-0 top-0 text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>

          {/* Profile card */}
          <NavLink
            to="/restaurant/profile"
            onClick={onClose}
            className="group flex flex-col items-center text-center gap-2 rounded-xl p-2 -m-2 transition hover:bg-white/5"
          >
            <div className="relative">
              {isLoading ? (
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
              ) : showImage ? (
                <img
                  src={restaurantData.image}
                  alt={restaurantData.name}
                  onError={() => setImageFailed(true)}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-white/15 group-hover:ring-white/30 transition"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#163A63] ring-2 ring-white/15 group-hover:ring-white/30 transition flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {getInitials(restaurantData.name) || 'R'}
                  </span>
                </div>
              )}

              {/* Edit affordance */}
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#0B1F3A] ring-2 ring-[#0B1F3A] text-white/70 group-hover:text-white transition">
                <Pencil size={11} />
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-1.5 w-full flex flex-col items-center pt-1">
                <div className="h-3.5 w-28 rounded bg-white/10 animate-pulse" />
                <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
              </div>
            ) : (
              <div>
                <h1 className="font-bold text-white text-base leading-tight tracking-wide truncate max-w-[13rem]">
                  {restaurantData.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      restaurantData.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span className={restaurantData.isOpen ? 'text-emerald-300' : 'text-white/60'}>
                    {restaurantData.isOpen ? 'Open for Orders' : 'Closed'}
                  </span>
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `dashboard-nav-item flex items-center justify-between px-4 py-3 font-medium ${isActive ? 'bg-[#163A63] text-white' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="space-y-1.5 pt-6 border-t border-white/10 mt-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#0B1F3A] hover:bg-slate-100 font-medium rounded-md transition text-sm mb-3"
        >
          <ExternalLink size={16} /> View Store Online
        </a>

        <NavLink
          to="/restaurant/help-center"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition text-sm ${
              isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:text-white hover:bg-white/15'
            }`
          }
        >
          <HelpCircle size={18} /> Help Center
        </NavLink>

        <button
          onClick={onLogout}
           className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition w-full text-left text-sm"
        >
          <LogOut size={18} /> Logout Store
        </button>
      </div>
    </aside>
  );
}