import React, { useState, useEffect } from 'react';
import { Eye, Search, X, ShoppingBag } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../../services/adminService';

const filterTabs = ['All', 'Placed', 'Accepted', 'Preparing', 'Ready', 'Out For Delivery', 'Delivered', 'Completed', 'Cancelled'];

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
      alert('បរាជ័យក្នុងការប្តូរ Status!');
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'placed': return 'bg-blue-100 text-blue-600';
      case 'accepted': return 'bg-indigo-100 text-indigo-600';
      case 'preparing': return 'bg-amber-100 text-amber-700';
      case 'ready': return 'bg-emerald-100 text-emerald-700';
      case 'out for delivery': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">កំពុងទាញយក Orders...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#fffaf8] min-h-screen text-slate-800 space-y-6">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Order Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Track and manage all customer orders in real-time.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 transition shadow-sm"
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
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3.5 px-4 sm:px-6">Order #</th>
                <th className="py-3.5 px-4 sm:px-6">Customer</th>
                <th className="py-3.5 px-4 sm:px-6">Restaurant</th>
                <th className="py-3.5 px-4 sm:px-6">Total</th>
                <th className="py-3.5 px-4 sm:px-6">Time</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.real_id} className="hover:bg-orange-50/20 transition">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-800 whitespace-nowrap">{order.id}</td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 whitespace-nowrap">{order.customer}</td>
                    <td className="py-4 px-4 sm:px-6 text-slate-500 whitespace-nowrap">{order.restaurant_name}</td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 whitespace-nowrap">{order.price}</td>
                    <td className="py-4 px-4 sm:px-6 text-slate-400 text-xs whitespace-nowrap">{order.time}</td>
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.real_id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border-none outline-none ${getStatusBadge(order.status)}`}
                      >
                        {filterTabs.filter(t => t !== 'All').map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
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
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Order {selectedOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-xs">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Info</p>
                <p className="font-bold text-slate-900">{selectedOrder.customer}</p>
                <p className="text-slate-500 text-xs">{selectedOrder.phone || 'N/A'}</p>
                <p className="text-slate-500 text-xs">{selectedOrder.address || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Restaurant</p>
                <p className="font-medium text-slate-800">{selectedOrder.restaurant_name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Order Items</p>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700">
                  <p>{selectedOrder.items}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-orange-600">{selectedOrder.price}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
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