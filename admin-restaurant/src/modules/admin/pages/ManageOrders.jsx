import React, { useState, useEffect } from 'react';
import { Eye, Search, X, ShoppingBag } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../../services/adminService';

const filterTabs = ['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Delivering', 'Delivered', 'Completed', 'Cancelled'];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      console.log("API Orders Response:", response.data);
      
      const ordersData = response.data.orders || response.data.data || response.data || [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleStatusChange = async (realId, newStatus) => {
    try {
      await updateOrderStatus(realId, { status: newStatus });
      fetchOrdersData();
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update order status.');
    }
  };

  // Filter Orders (Case-insensitive match)
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'All' || order.status?.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      order.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Returns { text, bg, border } instead of a single pill class, so the
  // badge can render as a square, left-accented tag consistent with the
  // Drivers page rather than a rounded-full pill.
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { text: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-400' };
      case 'accepted': return { text: 'text-[#0B1F3B]', bg: 'bg-[#EEF2F8]', border: 'border-[#0B1F3B]' };
      case 'preparing': return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-500' };
      case 'ready': return { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-500' };
      case 'delivering': return { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-500' };
      case 'delivered': return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-500' };
      case 'completed': return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-600' };
      case 'cancelled': return { text: 'text-[#A6321E]', bg: 'bg-[#FBEEEC]', border: 'border-[#A6321E]' };
      default: return { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-400' };
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading orders...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#F4F5F7] min-h-screen text-[#1A2233] space-y-6">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F3B] tracking-tight">Order Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Track and manage all customer orders in real-time.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#D6DBE3] text-sm focus:outline-none focus:border-[#0B1F3B] transition"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-[#D6DBE3]">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap shrink-0 border-b-2 -mb-px cursor-pointer ${
              activeTab === tab
                ? 'border-[#0B1F3B] text-[#0B1F3B]'
                : 'border-transparent text-slate-500 hover:text-[#0B1F3B]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white border border-[#D6DBE3] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#0B1F3B] text-[11px] font-semibold text-white/90">
                <th className="py-3 px-4 sm:px-6">Order #</th>
                <th className="py-3 px-4 sm:px-6">Customer</th>
                <th className="py-3 px-4 sm:px-6">Restaurant</th>
                <th className="py-3 px-4 sm:px-6">Total</th>
                <th className="py-3 px-4 sm:px-6">Time</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEDF1] text-sm">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const statusStyle = getStatusStyle(order.status);
                  return (
                    <tr key={order.real_id} className="hover:bg-[#F7F9FC] transition">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#1A2233] whitespace-nowrap">{order.id}</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-[#1A2233] whitespace-nowrap">{order.customer}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-500 whitespace-nowrap">{order.restaurant_name}</td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-[#1A2233] whitespace-nowrap">{order.price}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-slate-400 text-xs whitespace-nowrap">{order.time}</td>
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.real_id, e.target.value)}
                          className={`pl-2.5 pr-2 py-1 text-xs font-semibold cursor-pointer outline-none border-l-2 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {filterTabs.filter(t => t !== 'All').map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="text-slate-400 hover:text-[#0B1F3B] hover:bg-[#EEF2F8] p-1.5 transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
                    No orders found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Order Details Modal */}
      {selectedOrder && (() => {
        const statusStyle = getStatusStyle(selectedOrder.status);
        return (
          <div className="fixed inset-0 bg-[#0B1F3B]/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-[#D6DBE3]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6DBE3] bg-[#0B1F3B]">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-white" />
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    Order {selectedOrder.id}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="text-white/70 hover:text-white p-1 cursor-pointer"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-sm">
                <div className="flex justify-between items-center pb-3 border-b border-[#D6DBE3]">
                  <span className="text-slate-500 text-xs">Status</span>
                  <span className={`pl-2.5 pr-3 py-1 text-xs font-semibold border-l-2 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Customer info</p>
                  <p className="font-bold text-[#1A2233]">{selectedOrder.customer}</p>
                  <p className="text-slate-500 text-xs">{selectedOrder.phone || 'N/A'}</p>
                  <p className="text-slate-500 text-xs">{selectedOrder.address || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">Restaurant</p>
                  <p className="font-medium text-[#1A2233]">{selectedOrder.restaurant_name}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">Order items</p>
                  <div className="bg-[#FAFBFC] border border-[#D6DBE3] p-3 text-xs text-slate-700">
                    <p>{selectedOrder.items}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D6DBE3] flex justify-between items-center text-base font-bold text-[#1A2233]">
                  <span>Total Amount:</span>
                  <span className="text-[#0B1F3B]">{selectedOrder.price}</span>
                </div>
              </div>

              <div className="p-4 bg-[#FAFBFC] border-t border-[#D6DBE3] text-right">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}