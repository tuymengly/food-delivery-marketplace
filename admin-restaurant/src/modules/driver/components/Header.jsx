import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';

export default function Header({ 
  setIsSidebarOpen, 
  searchTerm, 
  setSearchTerm, 
  user 
}) {
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
            placeholder="Search orders, restaurants, users..." 
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

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
            {user?.name ? user.name.charAt(0) : 'T'}
          </div>

          <div className="hidden sm:block text-left leading-tight">
            <h4 className="text-xs font-bold text-gray-900 group-hover:text-orange-600 transition">
              {user?.name || 'Tom Wright'}
            </h4>
            <span className="text-[10px] text-gray-400 font-medium">
              {user?.role || 'Super Admin'}
            </span>
          </div>

          <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition" />
        </div>

      </div>
    </header>
  );
}