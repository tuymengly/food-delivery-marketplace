import React, { useState } from 'react';
import { Clock, X, ShoppingBag, User, DollarSign, Tag } from 'lucide-react';

export default function Orders() {
  const [activeTab, setActiveTab] = useState('All Orders');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const tabs = ['All Orders', 'New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  const [ordersData, setOrdersData] = useState([
    {
      id: '#BR-8490',
      customer: 'Maria Chen',
      items: 'Double Smash Burger × 2, Truffle Fries × 1',
      price: '$37.97',
      time: '2 min ago',
      status: 'New',
      statusBg: 'bg-blue-100 text-blue-600',
    },
    {
      id: '#BR-8487',
      customer: 'James Okafor',
      items: 'Crispy Chicken Burger × 1, Milkshake × 2',
      price: '$27.97',
      time: '8 min ago',
      status: 'Preparing',
      statusBg: 'bg-amber-100 text-amber-700',
    },
    {
      id: '#BR-8484',
      customer: 'Sophie Laurent',
      items: 'Classic Smash Burger × 3',
      price: '$44.97',
      time: '15 min ago',
      status: 'Ready',
      statusBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: '#BR-8480',
      customer: 'David Nguyen',
      items: 'Spicy Jalapeño × 1, Fries × 2',
      price: '$31.97',
      time: '22 min ago',
      status: 'Accepted',
      statusBg: 'bg-indigo-100 text-indigo-700',
    },
  ]);

  // Function សម្រាប់ប្តូរ Status តាម ID នៃ Order
  const handleUpdateStatus = (id, newStatus, newBg) => {
    setOrdersData((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id ? { ...order, status: newStatus, statusBg: newBg } : order
      )
    );
  };

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'All Orders' 
    ? ordersData 
    : ordersData.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="p-4 sm:p-6 bg-[#fcfbfa] min-h-screen space-y-4 sm:space-y-6 text-gray-800">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5 sm:mt-1">Manage and update incoming orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-[#ea580c] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-gray-400 text-xs sm:text-sm font-medium bg-white rounded-2xl border border-gray-100">
            No orders found in "{activeTab}" status.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3 sm:pb-0 sm:border-none">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">
                    {order.id} — {order.customer}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">{order.items}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${order.statusBg}`}>
                    {order.status}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-gray-900">{order.price}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 sm:pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Clock size={14} />
                  <span>{order.time}</span>
                </div>

                {/* Event Handlers លើ Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                  {order.status === 'New' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Accepted', 'bg-indigo-100 text-indigo-700')}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#ea580c] text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => setSelectedOrderDetails(order)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                      >
                        Details
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Cancelled', 'bg-rose-100 text-rose-700')}
                        className="px-3.5 py-1.5 text-rose-500 text-xs font-bold hover:bg-rose-50 rounded-xl transition"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === 'Accepted' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Preparing', 'bg-amber-100 text-amber-700')}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition"
                      >
                        Mark Preparing
                      </button>
                      <button 
                        onClick={() => setSelectedOrderDetails(order)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                      >
                        Details
                      </button>
                    </>
                  )}

                  {order.status === 'Preparing' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Ready', 'bg-emerald-100 text-emerald-700')}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
                      >
                        Mark Ready
                      </button>
                      <button 
                        onClick={() => setSelectedOrderDetails(order)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                      >
                        Details
                      </button>
                    </>
                  )}

                  {order.status === 'Ready' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'Completed', 'bg-green-100 text-green-700')}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition"
                      >
                        Mark Completed
                      </button>
                      <button 
                        onClick={() => setSelectedOrderDetails(order)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                      >
                        Details
                      </button>
                    </>
                  )}

                  {(order.status === 'Completed' || order.status === 'Cancelled') && (
                    <button 
                      onClick={() => setSelectedOrderDetails(order)}
                      className="w-full sm:w-auto px-3.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog for Order Details */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  Order Details
                </h2>
                <p className="text-xs text-gray-400 font-medium">{selectedOrderDetails.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium text-gray-700">
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">Customer</p>
                  <p className="font-bold text-gray-900">{selectedOrderDetails.customer}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                <ShoppingBag size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold">Ordered Items</p>
                  <p className="font-bold text-gray-900">{selectedOrderDetails.items}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <DollarSign size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold">Total Price</p>
                    <p className="font-bold text-gray-900">{selectedOrderDetails.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <Tag size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrderDetails.statusBg}`}>
                      {selectedOrderDetails.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
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