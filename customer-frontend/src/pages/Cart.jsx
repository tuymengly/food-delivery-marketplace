import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // 🔸 Check authentication on mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [navigate]);

  // 🔸 Load cart from localStorage
  const loadCart = () => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) setCartItems(JSON.parse(storedCart));
  };

  // 🔸 Select / Deselect items
  const toggleItemSelection = (itemId, itemType) => {
    const itemKey = `${itemId}-${itemType}`;
    setSelectedItems((prev) =>
      prev.includes(itemKey)
        ? prev.filter((key) => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  const isItemSelected = (itemId, itemType) =>
    selectedItems.includes(`${itemId}-${itemType}`);

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      const allKeys = cartItems.map((item) => `${item.id}-${item.type}`);
      setSelectedItems(allKeys);
    }
  };

  const isAllSelected = () =>
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  // 🔸 Quantity controls
  const updateQuantity = (itemId, itemType, newQty) => {
    if (newQty < 1) return;
    const updated = cartItems.map((item) =>
      item.id === itemId && item.type === itemType
        ? { ...item, quantity: newQty }
        : item
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleQuantityInput = (itemId, itemType, value) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      updateQuantity(itemId, itemType, num);
    } else if (value === '') {
      const temp = cartItems.map((item) =>
        item.id === itemId && item.type === itemType
          ? { ...item, quantity: '' }
          : item
      );
      setCartItems(temp);
    }
  };

  const handleQuantityBlur = (itemId, itemType, qty) => {
    if (qty === '' || qty < 1) updateQuantity(itemId, itemType, 1);
  };

  // 🔸 Remove items
  const removeFromCart = (itemId, itemType) => {
    const updated = cartItems.filter(
      (item) => !(item.id === itemId && item.type === itemType)
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // 🔸 Calculations
  const calculateSubtotal = () =>
    cartItems
      .filter((item) => isItemSelected(item.id, item.type))
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);

  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const delivery = subtotal > 0 ? 2.0 : 0;
    return (subtotal + delivery).toFixed(2);
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to checkout');
      return;
    }
    localStorage.setItem('selectedItems', JSON.stringify(selectedItems));
    navigate('/checkout');
  };

  // 🔸 Empty Cart View
  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20 pb-16 px-4 sm:px-6 md:px-14">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text text-transparent mb-4">
            My Order
          </h1>
          <p className="text-gray-600 text-lg mb-8">Your delicious items</p>

          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <FaShoppingCart className="text-6xl text-orange-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Your Order is Empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Start adding delicious Khmer dishes to your order!
            </p>
            <Link
              to="/MenuFood"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🔸 Non-empty cart view
  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20 pb-16 px-4 sm:px-6 md:px-14 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text text-transparent mb-2">
              My Order
            </h1>
            <p className="text-gray-600 text-lg">
              You have {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your order
            </p>
          </div>
          <button
            onClick={clearCart}
            className="mt-4 md:mt-0 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-semibold flex items-center gap-2 transition"
          >
            <FaTrash /> Clear Order
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 accent-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  Select All ({selectedItems.length}/{cartItems.length})
                </span>
              </label>
            </div>

            {cartItems.map((item) => (
              <div
                key={`${item.id}-${item.type}`}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden border border-gray-100"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
                  {/* Image */}
                  <div className="w-full sm:w-32 h-32 flex-shrink-0 mx-auto sm:mx-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">{item.category}</p>
                      <p className="text-xl font-bold text-orange-600">${item.price}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.type, (item.quantity || 1) - 1)
                          }
                          className="w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center disabled:opacity-50"
                          disabled={item.quantity <= 1}
                        >
                          <FaMinus className="text-orange-600 text-sm" />
                        </button>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityInput(item.id, item.type, e.target.value)
                          }
                          onBlur={() =>
                            handleQuantityBlur(item.id, item.type, item.quantity)
                          }
                          className="w-16 text-center text-lg font-bold border border-gray-300 rounded-lg focus:border-orange-500"
                        />

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.type, (item.quantity || 0) + 1)
                          }
                          className="w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center"
                        >
                          <FaPlus className="text-orange-600 text-sm" />
                        </button>
                      </div>

                      <p className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Right side controls */}
                  <div className="flex sm:flex-col items-center justify-between gap-3 sm:pl-4 sm:border-l sm:border-gray-200 mt-4 sm:mt-0">
                    <input
                      type="checkbox"
                      checked={isItemSelected(item.id, item.type)}
                      onChange={() => toggleItemSelection(item.id, item.type)}
                      className="w-6 h-6 accent-orange-600 border-2 border-gray-300 rounded-md focus:ring-orange-500"
                    />
                    <button
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="p-2.5 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:sticky lg:top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="flex items-center gap-2">
                    <MdDeliveryDining className="text-xl" /> Delivery
                  </span>
                  <span className="font-semibold">$2.00</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-orange-600">${total}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition mb-4"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/MenuFood"
                className="block text-center text-orange-600 hover:text-orange-700 font-semibold"
              >
                ← Continue Shopping
              </Link>

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

export default Cart;
