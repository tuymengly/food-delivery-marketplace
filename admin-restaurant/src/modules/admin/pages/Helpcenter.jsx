import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Bug, 
  ExternalLink, 
  CheckCircle, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');

  const guides = [
    { title: 'How to verify new driver documents', category: 'Driver Management', time: '5 min read' },
    { title: 'Processing manual refunds & chargebacks', category: 'Payments', time: '3 min read' },
    { title: 'Resolving flagged reviews and complaints', category: 'Reviews', time: '4 min read' },
    { title: 'Setting up restaurant commission rates', category: 'Restaurants', time: '6 min read' },
  ];
  return (
    <div className="p-8 bg-[#fffaf8] min-h-screen text-gray-800 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Help Center</h1>
        <p className="text-sm text-gray-500 mt-1">Documentation, SOP guidelines, and technical support for admins.</p>
      </div>

      {/* Hero Search Bar */}
      <div className="bg-gradient-to-r from-[#f96b44] to-[#e05630] rounded-2xl p-8 text-white shadow-md text-center space-y-4">
        <h2 className="text-2xl font-bold">How can we help you today?</h2>
        <div className="relative max-w-xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search SOPs, driver guides, payment issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-gray-800 rounded-xl text-sm focus:outline-none shadow-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#f96b44] flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">SOP Documentation</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Standard operating procedures for managing platform operations.</p>
          <button className="text-xs font-bold text-[#f96b44] flex items-center gap-1 hover:underline">
            Browse Documents <ChevronRight size={14} />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">System Status</h3>
          <p className="text-xs text-gray-500 mt-1 mb-1">All Systems Operational</p>
          <p className="text-[11px] text-emerald-600 font-semibold mb-3">● Payment Gateways & Maps Active</p>
          <button className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
            View Live Status <ExternalLink size={12} />
          </button>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <Bug size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Report Technical Bug</h3>
          <p className="text-xs text-gray-500 mt-1 mb-3">Found a bug in dashboard? Send ticket directly to dev team.</p>
          <button className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:underline">
            Submit Support Ticket <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Popular Admin Guides */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Popular Admin Guides</h3>
        <div className="divide-y divide-gray-100">
          {guides.map((item, index) => (
            <div key={index} className="py-3 flex items-center justify-between hover:bg-orange-50/20 px-2 rounded-xl transition cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.title}</p>
                  <span className="text-xs text-gray-400">{item.category} • {item.time}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}