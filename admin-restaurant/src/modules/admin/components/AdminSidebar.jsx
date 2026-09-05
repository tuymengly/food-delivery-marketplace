import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Bike, 
  FolderTree, 
  Utensils,
  ShoppingBag, 
  CreditCard, 
  Star, 
  Settings, 
  ExternalLink,
  HelpCircle,
  LogOut,
  X 
} from 'lucide-react';

import logoImg from '../../../assets/logo.png';

export default function AdminSidebar({ onClose }) {
  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Restaurants', path: '/admin/restaurants', icon: Store },
    { name: 'Drivers', path: '/admin/drivers', icon: Bike },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Menu / Foods', path: '/admin/foods', icon: Utensils },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[linear-gradient(180deg,#ff5a00_0%,#ff5a00_72%,#ff3045_100%)] text-white flex flex-col justify-between p-4 h-full overflow-y-auto">
      <div>
        <div className="relative pb-4 mb-6 border-b border-white/10 text-center">
          <button 
            onClick={onClose} 
            className="md:hidden absolute right-0 top-0 text-gray-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center justify-center space-y-2 pt-1">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-white/5 p-1 border border-white/10 shadow-lg">
              <img 
                src={logoImg} 
                alt="24 Hour Food Logo" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight tracking-wide">24 HOUR FOOD</h1>
              <p className="text-xs text-white/80 mt-0.5 font-medium">Super Admin Panel</p>
            </div>
          </div>
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
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${
                    isActive ? 'bg-white/20 text-white shadow-md' : 'hover:bg-white/15 text-white/90 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Options */}
      <div className="space-y-1 pt-6 border-t border-white/10 mt-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-orange-600 hover:bg-orange-50 font-medium rounded-xl transition text-sm mb-3 shadow-sm"
        >
          <ExternalLink size={16} /> View Live Store
        </a>

        <NavLink
          to="/admin/help-center"
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
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/15 rounded-xl transition w-full text-left text-sm"
        >
          <LogOut size={18} /> Exit Admin
        </button>
      </div>
    </aside>
  );
}
