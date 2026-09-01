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
  X
} from 'lucide-react';

import logoImg from '../../../assets/logo.png';
export default function RestaurantSidebar({ onClose }) {
  const menuItems = [
    { name: 'Dashboard', path: '/restaurant/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/restaurant/orders', icon: ShoppingBag },
    { name: 'Manage Foods', path: '/restaurant/foods', icon: UtensilsCrossed },
    { name: 'Categories', path: '/restaurant/categories', icon: FolderTree },
    { name: 'Sales & Earnings', path: '/restaurant/sales', icon: DollarSign },
    { name: 'Reviews', path: '/restaurant/reviews', icon: Star },
    { name: 'Profile / Settings', path: '/restaurant/profile', icon: User },
  ];
  return (
    <aside className="w-64 bg-[#1e130c] text-gray-300 flex flex-col justify-between p-4 h-full overflow-y-auto">
      <div>
        <div className="relative mb-6 pt-2 pb-4 border-b border-white/10 text-center">
          <button 
            onClick={onClose}
            className="lg:hidden absolute right-0 top-0 text-gray-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>

          {/* Logo Card & Text */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-white/5 p-1 border border-white/10 shadow-lg">
              <img 
                src={logoImg} 
                alt="24 Hour Food Logo" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            
            <div>
              <h1 className="font-bold text-white text-base leading-tight tracking-wide">24 HOUR FOOD</h1>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Open for Orders
              </span>
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
                  `flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${
                    isActive ? 'bg-[#e03a11] text-white shadow-md' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                  }`
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
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#e03a11] hover:bg-[#c7320e] text-white font-medium rounded-xl transition text-sm mb-3 shadow-sm"
        >
          <ExternalLink size={16} /> View Store Online
        </a>

        <NavLink
          to="/restaurant/help-center"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition text-sm ${
              isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <HelpCircle size={18} /> Help Center
        </NavLink>

        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition w-full text-left text-sm"
        >
          <LogOut size={18} /> Logout Store
        </button>
      </div>
    </aside>
  );
}
