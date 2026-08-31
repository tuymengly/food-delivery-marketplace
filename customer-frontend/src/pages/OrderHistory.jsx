import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaCalendar, FaMapMarkerAlt, FaPhone, FaCreditCard, FaMoneyBillWave, FaChevronDown, FaChevronUp, FaShoppingBag } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';

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

    // Load orders from localStorage
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    // Sort by date (newest first)
    const sortedOrders = storedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    setOrders(sortedOrders);
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delivering':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-4">
              Order History
            </h1>
            <p className="text-gray-600 text-lg">Your past orders</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <FaHistory className="text-6xl text-orange-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No Orders Yet</h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              You haven't placed any orders yet. Start ordering delicious Khmer dishes!
            </p>
            <button
              onClick={() => navigate('/MenuFood')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-2">
            Order History
          </h1>
          <p className="text-gray-600 text-lg">
            You have {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 border border-gray-100">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filterStatus === 'delivered'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <FaShoppingBag className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Order #{order.id}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <FaCalendar className="text-orange-600" />
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-lg font-semibold border-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {isExpanded ? (
                        <FaChevronUp className="text-2xl text-gray-400" />
                      ) : (
                        <FaChevronDown className="text-2xl text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Items</p>
                        <p className="text-lg font-bold text-gray-900">{order.items.length}</p>
                      </div>
                      <div className="h-10 w-px bg-gray-300"></div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-lg font-bold text-orange-600">${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Quick Item Preview */}
                    <div className="hidden md:flex items-center gap-2">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-sm font-bold text-orange-600">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gradient-to-b from-orange-50 to-white">
                    {/* Order Items */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={`${item.id}-${item.type}-${index}`}
                            className="flex gap-4 p-3 bg-white rounded-xl border border-gray-200"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-500">{item.category}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-sm text-gray-600">
                                  ${item.price.toFixed(2)} × {item.quantity}
                                </span>
                                <span className="font-bold text-orange-600">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Price Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal</span>
                          <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span className="flex items-center gap-2">
                            <MdDeliveryDining className="text-xl" />
                            Delivery Fee
                          </span>
                          <span className="font-semibold">${order.delivery.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <div className="flex justify-between text-xl font-bold">
                            <span className="text-gray-900">Total</span>
                            <span className="text-orange-600">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="p-6 grid md:grid-cols-2 gap-6">
                      {/* Delivery Info */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <MdDeliveryDining className="text-orange-600" />
                          Delivery Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <FaPhone className="text-orange-600 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-semibold text-gray-900">{order.customerInfo.fullName}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FaPhone className="text-orange-600 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-semibold text-gray-900">{order.customerInfo.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FaMapMarkerAlt className="text-orange-600 mt-1" />
                            <div>
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-semibold text-gray-900">
                                {order.customerInfo.address}, {order.customerInfo.city}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaCreditCard className="text-orange-600" />
                          Payment Method
                        </h4>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            {order.customerInfo.paymentMethod === 'cash' ? (
                              <>
                                <FaMoneyBillWave className="text-3xl text-green-600" />
                                <div>
                                  <p className="font-semibold text-gray-900">Cash on Delivery</p>
                                  <p className="text-sm text-gray-600">Pay when delivered</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <FaCreditCard className="text-3xl text-blue-600" />
                                <div>
                                  <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                                  <p className="text-sm text-gray-600">Paid online</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reorder Button */}
                    <div className="p-6 bg-gradient-to-r from-orange-100 to-red-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add items from this order to cart
                          const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
                          const newCart = [...currentCart, ...order.items];
                          localStorage.setItem('cart', JSON.stringify(newCart));
                          window.dispatchEvent(new Event('cartUpdated'));
                          navigate('/cart');
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                      >
                        Reorder These Items
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredOrders.length === 0 && filterStatus !== 'all' && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No {filterStatus} orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
