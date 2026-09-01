import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaUser, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'cash'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load cart and selected items from localStorage
    const storedCart = localStorage.getItem('cart');
    const storedSelected = localStorage.getItem('selectedItems');
    
    if (storedCart) {
      const cart = JSON.parse(storedCart);
      const selected = storedSelected ? JSON.parse(storedSelected) : [];
      
      // Filter only selected items
      const itemsToCheckout = cart.filter(item => 
        selected.includes(`${item.id}-${item.type}`)
      );
      
      if (itemsToCheckout.length === 0) {
        navigate('/cart');
        return;
      }
      
      setCartItems(itemsToCheckout);
      setSelectedItems(selected);
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{9,10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const delivery = subtotal > 0 ? 2.00 : 0;
    return subtotal + delivery;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) {
      return;
    }

    // Create order object
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: cartItems,
      customerInfo: formData,
      subtotal: calculateSubtotal(),
      delivery: 2.00,
      total: calculateTotal(),
      status: 'pending'
    };

    // Store order in localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([...existingOrders, order]));

    // Remove ordered items from cart
    const remainingCart = JSON.parse(localStorage.getItem('cart') || '[]').filter(
      item => !selectedItems.includes(`${item.id}-${item.type}`)
    );
    localStorage.setItem('cart', JSON.stringify(remainingCart));
    localStorage.removeItem('selectedItems');
    window.dispatchEvent(new Event('cartUpdated'));

    // Navigate to order success page with order data
    navigate('/order-success', { state: { order } });
  };

  const subtotal = calculateSubtotal();
  const delivery = 2.00;
  const total = calculateTotal();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-24 pb-16 px-6 md:px-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text mb-2">
            Checkout
          </h1>
          <p className="text-gray-600 text-lg">Complete your order</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <MdDeliveryDining className="text-orange-600 text-3xl" />
                Delivery Information
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaUser className="inline mr-2 text-orange-600" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaPhone className="inline mr-2 text-orange-600" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                      errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'
                    }`}
                    placeholder="012 345 678"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-2 text-orange-600" />
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                      errors.address ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'
                    }`}
                    placeholder="Street address, building number, etc."
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none transition-all ${
                      errors.city ? 'border-red-500' : 'border-gray-300 focus:border-orange-500'
                    }`}
                    placeholder="Phnom Penh"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-none"
                    placeholder="Any special instructions for delivery..."
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FaCreditCard className="text-orange-600 text-3xl" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-orange-600 cursor-pointer"
                  />
                  <FaMoneyBillWave className="text-2xl text-green-600 ml-4 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive your order</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-orange-600 cursor-pointer"
                  />
                  <FaCreditCard className="text-2xl text-blue-600 ml-4 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                    <p className="text-sm text-gray-500">Secure online payment</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Items List */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.type}`} className="flex gap-3 pb-4 border-b border-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.category}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="font-bold text-orange-600">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="flex items-center gap-2">
                    <MdDeliveryDining className="text-xl" />
                    Delivery
                  </span>
                  <span className="font-semibold">${delivery.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 mb-4"
              >
                Place Order
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="w-full text-center text-orange-600 hover:text-orange-700 font-semibold"
              >
                ← Back to Cart
              </button>

              {/* Free Delivery Promo */}
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl">
                <p className="text-sm font-semibold text-gray-900 mb-1">🎉 Free Delivery!</p>
                <p className="text-xs text-gray-700">On orders over $20</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
