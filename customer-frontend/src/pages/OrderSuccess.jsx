import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaMapMarkerAlt, FaPhone, FaUser, FaCreditCard, FaMoneyBillWave, FaHome, FaList, FaTruck } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Get order data from location state or localStorage
    if (location.state?.order) {
      setOrderData(location.state.order);
    } else {
      // Try to get the most recent order from localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      if (orders.length > 0) {
        setOrderData(orders[orders.length - 1]);
      } else {
        // No order found, redirect to home
        navigate('/');
      }
    }
  }, [location, navigate]);

  if (!orderData) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <FaCheckCircle className="text-6xl text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for your order! We're preparing your delicious meal.
            </p>
            <div className="inline-block bg-orange-100 px-6 py-3 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 mb-1">Order ID</p>
              <p className="text-2xl font-bold text-orange-600">#{orderData.id}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">{formatDate(orderData.date)}</p>
          </div>

          {/* Order Status */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <MdDeliveryDining className="text-4xl text-orange-600" />
              <div>
                <p className="text-lg font-bold text-gray-900">Estimated Delivery Time</p>
                <p className="text-3xl font-extrabold text-orange-600">30-45 minutes</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600">
              Your order is being prepared and will be delivered soon!
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <FaList className="text-orange-600" />
            Order Details
          </h2>

          {/* Ordered Items */}
          <div className="space-y-4 mb-8">
            {orderData.items.map((item, index) => (
              <div
                key={`${item.id}-${item.type}-${index}`}
                className="flex gap-4 p-4 bg-gradient-to-r from-orange-50 to-white rounded-xl border-2 border-orange-100 hover:border-orange-300 transition-all"
              >
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-700">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="border-t-2 border-gray-200 pt-6 space-y-3">
            <div className="flex justify-between text-gray-700 text-lg">
              <span>Subtotal</span>
              <span className="font-semibold">${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 text-lg">
              <span className="flex items-center gap-2">
                <MdDeliveryDining className="text-xl" />
                Delivery Fee
              </span>
              <span className="font-semibold">${orderData.delivery.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-orange-200 pt-3">
              <div className="flex justify-between text-2xl font-bold">
                <span className="text-gray-900">Total Paid</span>
                <span className="text-orange-600">${orderData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <MdDeliveryDining className="text-orange-600" />
            Delivery Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-orange-50 to-white p-4 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <FaUser className="text-orange-600 text-xl mt-1" />
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Full Name</p>
                  <p className="text-lg font-bold text-gray-900">{orderData.customerInfo.fullName}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-white p-4 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <FaPhone className="text-orange-600 text-xl mt-1" />
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                  <p className="text-lg font-bold text-gray-900">{orderData.customerInfo.phone}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-white p-4 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-orange-600 text-xl mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Delivery Address</p>
                  <p className="text-lg font-bold text-gray-900">
                    {orderData.customerInfo.address}, {orderData.customerInfo.city}
                  </p>
                </div>
              </div>
            </div>

            {orderData.customerInfo.notes && (
              <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Delivery Notes</p>
                    <p className="text-base text-gray-700 italic">{orderData.customerInfo.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <FaCreditCard className="text-orange-600" />
            Payment Method
          </h2>

          <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-4">
              {orderData.customerInfo.paymentMethod === 'cash' ? (
                <>
                  <FaMoneyBillWave className="text-4xl text-green-600" />
                  <div>
                    <p className="text-xl font-bold text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive your order</p>
                  </div>
                </>
              ) : (
                <>
                  <FaCreditCard className="text-4xl text-blue-600" />
                  <div>
                    <p className="text-xl font-bold text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Payment completed</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* ប៊ូតុង Track Order ថ្មី */}
          <button
            onClick={() => navigate('/order-tracking', { state: { order: orderData } })}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 px-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FaTruck className="text-xl" />
            Track Order
          </button>

          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 hover:bg-gray-900 text-white py-4 px-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FaHome className="text-xl" />
            Back to Home
          </button>

          <button
            onClick={() => navigate('/order-history')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FaList className="text-xl" />
            Order History
          </button>

          <button
            onClick={() => navigate('/MenuFood')}
            className="bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-600 py-4 px-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
          >
            Order More Food
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            🎉 Thank you for choosing Delish-Kh!
          </p>
          <p className="text-sm text-gray-700">
            Your satisfaction is our priority. Enjoy your meal! 🍽️
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;