import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaCalendar, FaMapMarkerAlt, FaPhone, FaCreditCard, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaShoppingBag } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';
import api from '../api/axios';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadOrders = async () => {
      try {
        const response = await api.get('/orders');
        const apiOrders = response.data.orders || response.data.data || [];
        const normalizedOrders = apiOrders.map((order) => ({
          ...order,
          date: order.date || order.created_at || new Date().toISOString(),
          total: Number(String(order.total || order.price || '0').replace(/[^0-9.]/g, '')) || 0,
          status: String(order.status || 'placed').toLowerCase(),
          items: Array.isArray(order.items) ? order.items : (order.items ? [{ name: order.items, quantity: 1 }] : []),
          customerInfo: order.customerInfo || {
            fullName: order.customer || 'Guest Customer',
            phone: order.phone || '',
            address: order.address || '',
            city: '',
            paymentMethod: 'cash',
          },
        }));
        setOrders(normalizedOrders);
      } catch (error) {
        console.error('Error fetching order history:', error);
        const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(storedOrders.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    };

    loadOrders();
  }, [navigate]);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'preparing':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'delivering':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return '✓';
      case 'cancelled':
        return '✗';
      default:
        return '⋯';
    }
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  if (orders.length === 0) {
    return (
      <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 font-sans rounded-none">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 border-b border-slate-300 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">
              Order History
            </h1>
            <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Your Past Orders</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-300 rounded-none shadow-sm">
            <div className="w-24 h-24 bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 rounded-none">
              <FaHistory className="text-4xl text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">No Orders Yet</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md text-sm font-medium">
              You haven't placed any orders yet. Start exploring the menu to make your first order.
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-none font-bold uppercase tracking-wider transition-colors border border-blue-950 shadow-sm"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 font-sans rounded-none">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-300 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">
            Order History
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {orders.length} {orders.length === 1 ? 'Total Order' : 'Total Orders'} Found
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white border border-slate-300 p-5 mb-8 rounded-none shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'all'
                  ? 'bg-blue-900 text-white border-blue-950'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'pending'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'delivered'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id);
            
            return (
              <div
                key={order.id}
                className="bg-white border border-slate-300 rounded-none shadow-sm transition-colors duration-200"
              >
                {/* Order Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-center shrink-0">
                        <FaShoppingBag className="text-slate-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Order #{order.id}</h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <FaCalendar className="text-slate-400" />
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-slate-100 sm:border-none pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <span className={`px-3 py-1.5 rounded-none font-bold text-[10px] uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                      {isExpanded ? (
                        <FaChevronUp className="text-xl text-slate-400" />
                      ) : (
                        <FaChevronDown className="text-xl text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 border border-slate-200 rounded-none">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Items</p>
                        <p className="text-base font-bold text-slate-900">{order.items.length}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-300"></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-base font-bold text-blue-900">${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Quick Item Preview */}
                    <div className="hidden md:flex items-center gap-3">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-none object-cover border border-slate-300 bg-white"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 rounded-none bg-slate-100 flex items-center justify-center border border-slate-300">
                          <span className="text-xs font-bold text-slate-600">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div className="border-t border-slate-300 bg-slate-50">
                    
                    {/* Order Items */}
                    <div className="p-6 border-b border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={`${item.id}-${item.type}-${index}`}
                            className="flex gap-4 p-4 bg-white rounded-none border border-slate-200 shadow-sm"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-none border border-slate-100 shrink-0"
                            />
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-900 text-sm uppercase tracking-wide">{item.name}</h5>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 mb-2">{item.category}</p>
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                <span className="text-xs font-bold text-slate-600">
                                  ${item.price.toFixed(2)} × {item.quantity}
                                </span>
                                <span className="text-sm font-bold text-blue-900">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="p-6 grid md:grid-cols-2 gap-8 border-b border-slate-200 bg-white">
                      {/* Delivery Info */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <MdDeliveryDining className="text-slate-500 text-lg" />
                          Delivery Details
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <FaPhone className="text-slate-400 mt-0.5 text-sm" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Contact Name</p>
                              <p className="text-xs font-bold text-slate-900">{order.customerInfo.fullName}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FaPhone className="text-slate-400 mt-0.5 text-sm" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Phone Number</p>
                              <p className="text-xs font-bold text-slate-900">{order.customerInfo.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FaMapMarkerAlt className="text-slate-400 mt-0.5 text-sm" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Delivery Address</p>
                              <p className="text-xs font-bold text-slate-900 leading-relaxed">
                                {order.customerInfo.address}, {order.customerInfo.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <FaCreditCard className="text-slate-500 text-sm" />
                          Payment Method
                        </h4>
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-none">
                          <div className="flex items-center gap-4">
                            {order.customerInfo.paymentMethod === 'cash' ? (
                              <>
                                <FaMoneyBillWave className="text-2xl text-emerald-700" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Cash on Delivery</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Pay upon receipt</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <FaCreditCard className="text-2xl text-blue-900" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Credit / Debit Card</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Paid online</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="p-6 bg-white">
                      <div className="max-w-md ml-auto space-y-3">
                        <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <span>Subtotal</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <MdDeliveryDining className="text-sm" />
                            Delivery Fee
                          </span>
                          <span>${order.delivery.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-300 pt-3 mt-3">
                          <div className="flex justify-between text-base font-bold uppercase tracking-wide">
                            <span className="text-slate-900">Total</span>
                            <span className="text-blue-900">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reorder Button */}
                    <div className="p-6 bg-slate-100 border-t border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
                          const newCart = [...currentCart, ...order.items];
                          localStorage.setItem('cart', JSON.stringify(newCart));
                          window.dispatchEvent(new Event('cartUpdated'));
                          navigate('/cart');
                        }}
                        className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3.5 rounded-none text-xs font-bold uppercase tracking-widest border border-blue-950 transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <FaShoppingBag /> Reorder These Items
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Results for Filter */}
        {filteredOrders.length === 0 && filterStatus !== 'all' && (
          <div className="text-center py-16 bg-white border border-slate-300 rounded-none shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No {filterStatus} orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;