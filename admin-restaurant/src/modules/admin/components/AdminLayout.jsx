import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Bell, ChevronDown, Menu, Search } from 'lucide-react';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Dark Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar - Drawer for Mobile, Fixed/Sticky for Desktop */}
      <div className={`fixed md:sticky top-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white border-b border-gray-100 sticky top-0 z-30 gap-2 md:gap-4">
          
          {/* Menu Button & Search */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-md">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg shrink-0"
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>

            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white text-xs md:text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e03a11] transition-all"
              />
            </div>
          </div>

          {/* User & Notification Controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2">
            {/* Notification Icon */}
            <button className="relative p-2 hover:bg-gray-50 rounded-full transition">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Info */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer sm:pl-4 sm:border-l sm:border-gray-200">
              <div className="w-9 h-9 bg-orange-100 text-[#e03a11] rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                T
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-gray-800 text-xs leading-tight">Tom Wright</span>
                <span className="text-[10px] text-gray-400 font-medium">Super Admin</span>
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden sm:inline" />
            </div>
          </div>

        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 md:p-8 flex-1 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}