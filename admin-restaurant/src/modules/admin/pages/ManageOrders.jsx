import React, { useState, useEffect } from 'react';
import { Eye, Search, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../../services/adminService';
const filterTabs = ['All', 'Placed', 'Accepted', 'Preparing', 'Ready', 'Out For Delivery', 'Delivered', 'Cancelled'];
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
      setOrders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrdersData();
      if (selectedOrder) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      alert('បរាជ័យក្នុងការប្តូរ Status!');
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === 'All' || order.status?.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      order.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Placed': return 'bg-blue-100 text-blue-600';
      case 'Accepted': return 'bg-indigo-100 text-indigo-600';
      case 'Preparing': return 'bg-amber-100 text-amber-700';
      case 'Ready': return 'bg-emerald-100 text-emerald-700';
      case 'Out For Delivery': return 'bg-orange-100 text-orange-700';
      case 'Delivered': return 'bg-green-100 text-green-600';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">កំពុងទាញយក Orders...</div>;
  }

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
                    <td className="py-4 px-4 sm:px-6 font-semibold text-gray-800 whitespace-nowrap">#{order.id}</td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900 whitespace-nowrap">{order.customer || order.user?.name}</td>
                    <td className="py-4 px-4 sm:px-6 text-gray-500 whitespace-nowrap">{order.restaurant || order.restaurant?.name}</td>
                    <td className="py-4 px-4 sm:px-6 font-bold text-gray-900 whitespace-nowrap">${order.total || order.total_amount}</td>
                    <td className="py-4 px-4 sm:px-6 text-gray-400 text-xs whitespace-nowrap">{order.date || order.created_at}</td>
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
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
                        className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition cursor-pointer"
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
      </div>

      {/* View Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#e03a11]" />
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  Order #{selectedOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500 text-xs">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer Info</p>
                <p className="font-bold text-gray-900">{selectedOrder.customer || selectedOrder.user?.name}</p>
                <p className="text-gray-500 text-xs">{selectedOrder.phone || selectedOrder.user?.phone}</p>
                <p className="text-gray-500 text-xs">{selectedOrder.address}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Restaurant</p>
                <p className="font-medium text-gray-800">{selectedOrder.restaurant || selectedOrder.restaurant?.name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Order Items</p>
                <ul className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs text-gray-700">
                  {selectedOrder.items?.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{typeof item === 'string' ? item : `${item.food_name} x ${item.quantity}`}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-base font-bold text-gray-900">
                <span>Total Amount:</span>
                <span className="text-[#e03a11]">${selectedOrder.total || selectedOrder.total_amount}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
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