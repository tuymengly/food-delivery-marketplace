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
  ExternalLink,
  HelpCircle,
  Settings,
  LogOut,
  ClipboardCheck,
  X
} from 'lucide-react';

import logoImg from '../../../assets/logo_no_bg.png';

export default function AdminSidebar({ onClose, pendingApplicationsCount = 0 }) {
  const menuGroups = [
    { label: 'Overview', items: [{ name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }] },
    { label: 'Marketplace', items: [
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Restaurants', path: '/admin/restaurants', icon: Store },
      { name: 'Restaurant Applications', path: '/admin/restaurant-applications', icon: ClipboardCheck, badge: pendingApplicationsCount },
      { name: 'Riders', path: '/admin/drivers', icon: Bike },
      { name: 'Categories', path: '/admin/categories', icon: FolderTree },
      { name: 'Menu / Foods', path: '/admin/foods', icon: Utensils },
    ] },
    { label: 'Operations', items: [
      { name: 'Order monitoring', path: '/admin/orders', icon: ShoppingBag },
      { name: 'Finance', path: '/admin/payments', icon: CreditCard },
      { name: 'Reviews', path: '/admin/reviews', icon: Star },
    ] },
    { label: 'System', items: [{ name: 'Settings', path: '/admin/settings', icon: Settings }] },
  ];

  return (
    <aside className="dashboard-sidebar w-64 text-white flex flex-col justify-between px-3 py-4 h-full overflow-y-auto">
      <div>
        <div className="relative pb-4 mb-5 border-b border-white/10 text-center">
          <button 
            onClick={onClose} 
            className="md:hidden absolute right-0 top-0 text-slate-400 hover:text-white p-1 rounded-md transition"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 pt-1 text-left">
            <div className="w-10 h-10 rounded-md bg-white p-1.5 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={logoImg} 
                alt="24 Hour Food Logo" 
                className="w-full h-full object-contain"
              />
            </div>
              <div>
              <h1 className="font-bold text-white text-sm leading-tight tracking-wide">24-HOUR FOOD</h1>
              <p className="text-[11px] text-white/55 mt-0.5 font-medium">Super Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-5">
          {menuGroups.map((group) => <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{group.label}</p>
            <div className="space-y-0.5">{group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `dashboard-nav-item flex items-center gap-3 px-3 py-2.5 font-medium text-sm ${isActive ? 'bg-[#163A63] text-white' : ''}`
                }
              >
                <Icon size={18} />
                <span className="flex-1">{item.name}</span>
                {!!item.badge && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}</div>
          </div>)}
        </nav>
      </div>

      {/* Footer Options */}
      <div className="space-y-1 pt-6 border-t border-white/10 mt-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-[#0B1F3A] hover:bg-slate-100 font-medium rounded-md transition text-sm mb-3"
        >
          <ExternalLink size={16} /> View Live Store
        </a>

        <NavLink
          to="/admin/help-center"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-md font-medium transition text-sm ${
              isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:text-white hover:bg-white/15'
            }`
          }
        >
          <HelpCircle size={18} /> Help Center
        </NavLink>

        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/15 rounded-md transition w-full text-left text-sm"
        >
          <LogOut size={18} /> Exit Admin
        </button>
      </div>
    </aside>
  );
}
