import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import RestaurantSidebar from './RestaurantSidebar';
import { Bell, ChevronDown, Menu, X, Search, UtensilsCrossed } from 'lucide-react';

export default function RestaurantLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 focus:bg-white text-xs sm:text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            
            {/* Live Order Counter Badge (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold">
              <UtensilsCrossed size={16} className="animate-pulse" />
              <span>Live Orders</span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 hover:bg-gray-100 rounded-xl transition text-gray-600">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2.5 cursor-pointer pl-2 sm:pl-4 border-l border-gray-200">
              <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                🍔
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-gray-800 text-xs leading-tight">Burger Joint</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Store Manager</span>
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden sm:inline" />
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
