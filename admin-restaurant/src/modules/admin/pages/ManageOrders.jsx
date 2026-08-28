import React, { useState } from 'react';
import { Eye, Search, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

const initialOrders = [
  { 
    id: '#BR-8493', 
    customer: 'Alex Johnson', 
    email: 'alex@example.com',
    phone: '+855 12 345 678',
    restaurant: 'The Burger Lab', 
    items: ['Double Cheeseburger x 2', 'Fries x 1', 'Coke x 2'],
    total: '$40.96', 
    date: 'Today, 7:58 PM', 
    status: 'Placed',
    address: 'Street 271, Phnom Penh'
  },
  { 
    id: '#BR-8490', 
    customer: 'Maria Chen', 
    email: 'maria@example.com',
    phone: '+855 98 765 432',
    restaurant: 'The Burger Lab', 
    items: ['Chicken Burger x 2', 'Onion Rings x 1'],
    total: '$37.97', 
    date: 'Today, 7:45 PM', 
    status: 'Preparing',
    address: 'Toul Kork, Phnom Penh'
  },
  { 
    id: '#BR-8487', 
    customer: 'James Okafor', 
    email: 'james@example.com',
    phone: '+855 77 112 233',
    restaurant: 'The Burger Lab', 
    items: ['Classic Beef Burger x 1'],
    total: '$27.97', 
    date: 'Today, 7:38 PM', 
    status: 'Accepted',
    address: 'BKK1, Phnom Penh'
  },
  { 
    id: '#BR-8484', 
    customer: 'Sophie Laurent', 
    email: 'sophie@example.com',
    phone: '+855 88 990 011',
    restaurant: 'The Burger Lab', 
    items: ['Veggie Combo Set x 1'],
    total: '$44.97', 
    date: 'Today, 7:30 PM', 
    status: 'Ready',
    address: 'Koh Pich, Phnom Penh'
  },
  { 
    id: '#BR-8480', 
    customer: 'David Nguyen', 
    email: 'david@example.com',
    phone: '+855 10 223 344',
    restaurant: 'Sushi Hana', 
    items: ['Salmon Roll Set x 1'],
    total: '$31.97', 
    date: 'Today, 7:20 PM', 
    status: 'Out For Delivery',
    address: 'Sen Sok, Phnom Penh'
  },
  { 
    id: '#BR-8472', 
    customer: 'Alex Johnson', 
    email: 'alex@example.com',
    phone: '+855 12 345 678',
    restaurant: 'The Burger Lab', 
    items: ['Bacon Deluxe x 2'],
    total: '$40.96', 
    date: 'Today, 7:00 PM', 
    status: 'Out For Delivery',
    address: 'Street 271, Phnom Penh'
  },
  { 
    id: '#BR-8465', 
    customer: 'Aisha Patel', 
    email: 'aisha@example.com',
    phone: '+855 92 887 766',
    restaurant: 'Pizza Roma', 
    items: ['Pepperoni Pizza (L) x 1'],
    total: '$22.98', 
    date: 'Today, 6:40 PM', 
    status: 'Delivered',
    address: 'Chroy Changvar, Phnom Penh'
  },
];

const filterTabs = ['All', 'Placed', 'Accepted', 'Preparing', 'Ready', 'Out For Delivery', 'Delivered', 'Cancelled'];

export default function ManageOrders() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter Orders
  const filteredOrders = initialOrders.filter((order) => {
    const matchesTab = activeTab === 'All' || order.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed':
        return 'bg-blue-100 text-blue-600';
      case 'Accepted':
        return 'bg-indigo-100 text-indigo-600';
      case 'Preparing':
        return 'bg-amber-100 text-amber-700';
      case 'Ready':
        return 'bg-emerald-100 text-emerald-700';
      case 'Out For Delivery':
        return 'bg-orange-100 text-orange-700';
      case 'Delivered':
        return 'bg-green-100 text-green-600';
      case 'Cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-gray-800 space-y-6">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Order Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track and manage all customer orders in real-time.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order ID, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-500 transition shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === tab
                ? 'bg-[#e03a11] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Table Scroll Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50/50">
                <th className="py-3.5 px-4 sm:px-6">Order #</th>
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4 sm:px-6">Restaurant</th>
                <th className="py-3.5 px-4 sm:px-6">Total</th>
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-gray-800 whitespace-nowrap">{order.id}</td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900 whitespace-nowrap">{order.customer}</td>
                    <td className="py-4 px-4 sm:px-6 text-gray-500 whitespace-nowrap">{order.restaurant}</td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900 whitespace-nowrap">{order.total}</td>
                    <td className="py-4 px-4 sm:px-6 text-gray-400 text-xs whitespace-nowrap">{order.date}</td>
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400 text-sm">
                    No orders found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Showing 1 to {filteredOrders.length} of {initialOrders.length} entries</span>
          <div className="flex items-center gap-1 font-medium">
            <button className="p-1 hover:text-gray-800 transition"><ChevronLeft size={16} /></button>
            <button className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">1</button>
            <button className="w-7 h-7 hover:bg-gray-100 rounded-full flex items-center justify-center">2</button>
            <button className="p-1 hover:text-gray-800 transition"><ChevronRight size={16} /></button>
          </div>
        </div>

      </div>

      {/* View Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#e03a11]" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  Order {selectedOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500 text-xs">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer Info</p>
                <p className="font-bold text-gray-900">{selectedOrder.customer}</p>
                <p className="text-gray-500 text-xs">{selectedOrder.phone}</p>
                <p className="text-gray-500 text-xs">{selectedOrder.address}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Restaurant</p>
                <p className="font-medium text-gray-800">{selectedOrder.restaurant}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Items</p>
                <ul className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs text-gray-700">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-base font-bold text-gray-900">
                <span>Total Amount:</span>
                <span className="text-[#e03a11]">{selectedOrder.total}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}