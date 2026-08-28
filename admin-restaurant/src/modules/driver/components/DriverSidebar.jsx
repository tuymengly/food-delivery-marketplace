import React from "react";
import { X, LogOut, HelpCircle } from "lucide-react";
import logoImg from '../../../assets/logo.png';

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  navItems,
}) {
  return (
    <>
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
        />
      )}
      <aside
        className={`
        fixed md:static top-0 left-0 h-full w-64 bg-[#17100e] text-gray-300 
        flex flex-col justify-between p-5 z-30 transition-transform duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="space-y-6">
          <div className="relative pb-4 border-b border-[#2d211c] text-center">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden absolute right-0 top-0 text-gray-400 hover:text-white p-1 rounded-lg transition"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center justify-center space-y-2 pt-1">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-white/5 p-1 border border-white/10 shadow-lg">
                <img
                  src={logoImg}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div>
                <h1 className="text-base font-black text-white tracking-wide leading-tight">
                  24 HOUR FOOD
                </h1>
                <span className="text-[11px] font-medium text-gray-400 block mt-0.5">
                  Driver Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#e13b11] text-white shadow-lg"
                      : "text-gray-400 hover:bg-[#261c18] hover:text-gray-200"
                  }`}
                >
                  <Icon
                    size={20}
                    className={isActive ? "text-white" : "text-gray-400"}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Options */}
        <div className="space-y-3 pt-4">
          <div className="border-t border-[#2d211c] pt-2 mb-2" />

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#261c18] rounded-xl transition">
              <HelpCircle size={18} />
              Help Center
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-[#261c18] rounded-xl transition">
              <LogOut size={18} />
              Exit Driver
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}