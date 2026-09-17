import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShoppingCart, FaTrash, FaMinus, FaPlus, FaStar, FaRegStar,
  FaMapMarkerAlt, FaStore, FaClock, FaTicketAlt, FaTimesCircle,
  FaMoneyBillWave, FaMobileAlt, FaQrcode, FaCreditCard, FaCheckCircle,
} from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';
import { clearCart as clearApiCart, fetchCart, removeCartItem, toggleFoodRecommendation, updateCartItem } from '../api/foodApi';
import { fetchRestaurant } from '../api/restaurantApi';
import { validateVoucher } from '../api/voucherApi';
import { createOrder, createPayWayPayment, getStoredUser } from '../api/app';
import { getStoredLocation } from '../utils/location';
import Toast from '../components/Toast';
import AddressPickerModal from '../components/AddressPickerModal';

const DELIVERY_FEE = 1.5;
const SERVICE_FEE = 0.3;

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', description: 'Pay when your order arrives', icon: FaMoneyBillWave },
  { id: 'khqr', label: 'ABA KHQR', description: 'Scan to pay with ABA or any KHQR bank app', icon: FaQrcode },
  { id: 'card', label: 'Credit / Debit Card', description: 'Pay securely with ABA PayWay checkout', icon: FaCreditCard },
];

const readStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState(() => readStoredJson('favorites', []));

  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const [orderType, setOrderType] = useState(
    () => localStorage.getItem('preferredOrderType') || 'delivery',
  );

  useEffect(() => {
    localStorage.removeItem('preferredOrderType');
  }, []);
  const [selectedLocation, setSelectedLocation] = useState(getStoredLocation);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [restaurantDetail, setRestaurantDetail] = useState(null);

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherApplying, setVoucherApplying] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const showToast = (message, type = 'error') => setToast({ message, type });

  const describeApiError = (error, fallback) => {
    const errors = error.response?.data?.errors;
    if (errors && typeof errors === 'object') {
      const detail = Object.values(errors).flat().join(' ');
      if (detail) return detail;
    }
    return error.response?.data?.message || error.message || fallback;
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (!currentUser || !localStorage.getItem('token')) {
      navigate('/login');
      return undefined;
    }

    let isCurrent = true;
    fetchCart()
      .then((apiCart) => {
        if (!isCurrent) return;
        setCartItems(apiCart);
        localStorage.setItem('cart', JSON.stringify(apiCart));
      })
      .catch((error) => {
        console.error('Error fetching cart:', error);
        if (isCurrent) setCartItems(readStoredJson('cart', []));
      })
      .finally(() => { if (isCurrent) setLoading(false); });

    return () => { isCurrent = false; };
  }, [navigate]);

  useEffect(() => {
    const syncLocation = () => setSelectedLocation(getStoredLocation());
    window.addEventListener('locationChanged', syncLocation);
    return () => window.removeEventListener('locationChanged', syncLocation);
  }, []);

  const restaurantId = cartItems[0]?.restaurant_id || null;

  useEffect(() => {
    if (!restaurantId) return undefined;
    let isCurrent = true;
    fetchRestaurant(restaurantId)
      .then((data) => { if (isCurrent) setRestaurantDetail(data); })
      .catch(() => { if (isCurrent) setRestaurantDetail(null); });
    return () => { isCurrent = false; };
  }, [restaurantId]);

  const toggleRecommend = async (item) => {
    const itemType = item.type || 'food';
    const isRecommended = favorites.some((favorite) => favorite.id === item.id && favorite.type === itemType);
    const updatedFavorites = isRecommended
      ? favorites.filter((favorite) => !(favorite.id === item.id && favorite.type === itemType))
      : [...favorites, { ...item, type: itemType }];

    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    window.dispatchEvent(new Event('favoritesUpdated'));

    try {
      await toggleFoodRecommendation(item.id);
    } catch (error) {
      setFavorites(favorites);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      window.dispatchEvent(new Event('favoritesUpdated'));
      showToast(error.response?.data?.message || 'Could not update recommendation.');
    }
  };

  const isRecommended = (item) => favorites.some(
    (favorite) => favorite.id === item.id && favorite.type === (item.type || 'food')
  );

  const updateQuantity = async (itemId, itemType, newQty) => {
    if (newQty < 1) return;
    const item = cartItems.find((cartItem) => cartItem.id === itemId && cartItem.type === itemType);
    if (item?.cartItemId) {
      try {
        await updateCartItem(item.cartItemId, newQty);
      } catch (error) {
        console.error('Error updating API cart item:', error);
      }
    }

    const updated = cartItems.map((cartItem) =>
      cartItem.id === itemId && cartItem.type === itemType ? { ...cartItem, quantity: newQty } : cartItem
    );
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeFromCart = async (itemId, itemType) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId && cartItem.type === itemType);
    if (item?.cartItemId) {
      try {
        await removeCartItem(item.cartItemId);
      } catch (error) {
        console.error('Error removing API cart item:', error);
      }
    }

    const updated = cartItems.filter((cartItem) => !(cartItem.id === itemId && cartItem.type === itemType));
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeRestaurantGroup = async (groupRestaurantId) => {
    const group = cartItems.filter((item) => item.restaurant_id === groupRestaurantId);
    await Promise.all(group.map((item) => removeFromCart(item.id, item.type)));
  };

  const clearCart = async () => {
    if (localStorage.getItem('token')) {
      try {
        await clearApiCart();
      } catch (error) {
        console.error('Error clearing API cart:', error);
      }
    }
    setCartItems([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const saveNotes = () => {
    setNotes(notesDraft.trim());
    setEditingNotes(false);
  };

  const cancelNotes = () => {
    setEditingNotes(false);
    setNotesDraft(notes);
  };

  const restaurantGroups = useMemo(() => {
    const groups = new Map();
    cartItems.forEach((item) => {
      const key = item.restaurant_id || 'unknown';
      if (!groups.has(key)) groups.set(key, { restaurantId: item.restaurant_id, name: item.restaurantName, items: [] });
      groups.get(key).items.push(item);
    });
    return Array.from(groups.values());
  }, [cartItems]);

  const hasMultipleRestaurants = restaurantGroups.length > 1;

  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );
  const deliveryFee = orderType === 'pickup' ? 0 : DELIVERY_FEE;
  const serviceFee = orderType === 'pickup' ? 0 : SERVICE_FEE;
  const discount = appliedVoucher?.discount_amount || 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  const applyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) return;
    setVoucherApplying(true);
    setVoucherError('');
    try {
      const data = await validateVoucher(code, subtotal);
      setAppliedVoucher(data);
      setVoucherOpen(false);
    } catch (error) {
      setVoucherError(error.response?.data?.message || 'Unable to apply this voucher.');
    } finally {
      setVoucherApplying(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError('');
  };

  const validateBeforeCheckout = () => {
    if (cartItems.length === 0) return 'Your cart is empty.';
    if (hasMultipleRestaurants) return 'Please order from one restaurant at a time.';
    if (orderType === 'delivery' && !selectedLocation?.addressId) return 'Please select a delivery address.';
    if (!paymentMethod) return 'Please select a payment method.';
    return null;
  };

  const handleCheckout = async () => {
    const validationMessage = validateBeforeCheckout();
    if (validationMessage) {
      setSubmitError(validationMessage);
      if (validationMessage === 'Please select a delivery address.') setAddressModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const payload = {
      order_type: orderType,
      payment_method: paymentMethod,
      notes: notes || undefined,
      voucher_code: appliedVoucher?.code || undefined,
      ...(orderType === 'delivery' ? { address_id: selectedLocation.addressId } : {}),
    };

    let savedOrder;
    try {
      const apiResponse = await createOrder(payload);
      savedOrder = apiResponse.data;
    } catch (error) {
      setSubmitError(describeApiError(error, 'Unable to place your order.'));
      setIsSubmitting(false);
      if (error.response?.data?.errors?.address_id) {
        localStorage.removeItem('deliveryLocation');
        setSelectedLocation(null);
        setAddressModalOpen(true);
      }
      return;
    }

    const user = getStoredUser() || {};
    const order = {
      id: savedOrder?.id || Date.now(),
      remoteId: savedOrder?.id,
      date: new Date().toISOString(),
      items: cartItems,
      orderType,
      pickupLocation: orderType === 'pickup'
        ? { name: restaurantDetail?.name || cartItems[0]?.restaurantName, address: restaurantDetail?.address }
        : null,
      customerInfo: {
        fullName: user.name || '',
        phone: user.phone || '',
        address: orderType === 'delivery'
          ? (selectedLocation?.address || '')
          : `Pickup at ${restaurantDetail?.name || cartItems[0]?.restaurantName || 'the restaurant'}`,
        city: orderType === 'delivery' ? (selectedLocation?.city || '') : '',
        notes,
        paymentMethod,
      },
      subtotal,
      delivery: deliveryFee,
      total,
      status: savedOrder?.status || 'pending',
    };

    const existingOrders = readStoredJson('orders', []);
    localStorage.setItem('orders', JSON.stringify([...(Array.isArray(existingOrders) ? existingOrders : []), order]));
    localStorage.setItem('lastOrderId', String(order.id));
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));

    if (['khqr', 'card'].includes(paymentMethod) && savedOrder?.id) {
      try {
        const paymentResponse = await createPayWayPayment(savedOrder.id, paymentMethod);
        const payment = paymentResponse.data;
        setIsSubmitting(false);
        navigate(`/payment/payway/${payment.id}`, { state: { payment, order } });
        return;
      } catch (error) {
        setSubmitError(describeApiError(error, 'Unable to start ABA PayWay payment. Please try another method.'));
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    navigate('/order-success', { state: { order } });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--canvas)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200" style={{ borderTopColor: 'var(--brand-navy)' }} />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="w-full min-h-screen pt-20 pb-16 px-4 sm:px-6 md:px-14" style={{ background: 'var(--canvas)' }}>
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#eef2f7' }}>
            <FaShoppingCart className="text-5xl" style={{ color: 'var(--muted)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>Your cart is empty</h1>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>Looks like you haven't added anything yet.</p>
          <Link to="/restaurants" className="app-button-primary inline-block px-8 py-3.5 font-semibold">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-20 pb-28 lg:pb-16 px-4 sm:px-6 md:px-14" style={{ background: 'var(--canvas)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {addressModalOpen && (
        <AddressPickerModal
          onClose={() => setAddressModalOpen(false)}
          onSelect={setSelectedLocation}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--brand-navy)' }}>Your Cart</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              From: <span className="font-semibold" style={{ color: 'var(--ink)' }}>{cartItems[0]?.restaurantName || 'Restaurant'}</span>
              {' · '}{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 hover:border-red-300 hover:text-red-600 transition"
            style={{ color: 'var(--muted)' }}
          >
            Clear cart
          </button>
        </div>

        {hasMultipleRestaurants && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Your cart has items from more than one restaurant. Please keep items from only one restaurant to check out.
            </p>
            <div className="flex flex-wrap gap-2">
              {restaurantGroups.map((group) => (
                <button
                  key={group.restaurantId}
                  onClick={() => removeRestaurantGroup(group.restaurantId)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                >
                  Remove items from {group.name || 'this restaurant'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: items + instructions */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.type}`} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  <div className="w-full sm:w-28 h-28 flex-shrink-0 mx-auto sm:mx-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--ink)' }}>{item.name}</h3>
                        <button
                          type="button"
                          onClick={() => toggleRecommend(item)}
                          title={isRecommended(item) ? 'Remove recommendation' : 'Recommend this food'}
                          className="shrink-0 p-1.5 rounded-full hover:bg-yellow-50 transition"
                        >
                          {isRecommended(item) ? (
                            <FaStar className="text-yellow-400" />
                          ) : (
                            <FaRegStar className="text-slate-300 hover:text-yellow-400" />
                          )}
                        </button>
                      </div>
                      {item.category && <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{item.category}</p>}
                      <p className="text-base font-bold" style={{ color: 'var(--brand-navy)' }}>${item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.type, (item.quantity || 1) - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 hover:border-[var(--brand-accent)] disabled:opacity-40 transition"
                        >
                          <FaMinus className="text-xs" style={{ color: 'var(--brand-navy)' }} />
                        </button>
                        <span className="w-8 text-center font-bold" style={{ color: 'var(--ink)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.type, (item.quantity || 0) + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 hover:border-[var(--brand-accent)] transition"
                        >
                          <FaPlus className="text-xs" style={{ color: 'var(--brand-navy)' }} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-base sm:text-lg font-bold whitespace-nowrap" style={{ color: 'var(--ink)' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id, item.type)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
                          aria-label={`Remove ${item.name}`}
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Special instructions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>Special instructions</h3>
              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="e.g. Please make it less spicy."
                    className="app-input w-full p-3 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveNotes} className="app-button-primary px-5 py-2 text-sm font-semibold">Save</button>
                    <button onClick={cancelNotes} className="px-5 py-2 text-sm font-semibold rounded-md border border-slate-200" style={{ color: 'var(--muted)' }}>Cancel</button>
                  </div>
                </div>
              ) : notes ? (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm italic" style={{ color: 'var(--ink)' }}>"{notes}"</p>
                  <button onClick={() => { setNotesDraft(notes); setEditingNotes(true); }} className="text-xs font-semibold shrink-0" style={{ color: 'var(--brand-accent)' }}>Edit</button>
                </div>
              ) : (
                <button
                  onClick={() => { setNotesDraft(''); setEditingNotes(true); }}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--brand-accent)' }}
                >
                  + Add special instructions
                </button>
              )}
            </div>
          </div>

          {/* Right: order type, address, voucher, payment, summary, checkout */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Order type */}
            <div className="bg-white cursor-pointer rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>Order type</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['delivery', 'pickup'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className="py-2.5 cursor-pointer rounded-lg text-sm font-semibold border transition capitalize"
                    style={orderType === type
                      ? { background: 'var(--brand-navy)', color: 'white', borderColor: 'var(--brand-navy)' }
                      : { color: 'var(--muted)', borderColor: 'var(--line)' }}
                  >
                    {type === 'pickup' ? 'Pick-up' : 'Delivery'}
                  </button>
                ))}
              </div>

              {orderType === 'delivery' ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <FaMapMarkerAlt className="mt-0.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Delivery Address</p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {selectedLocation?.address || 'No address selected'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setAddressModalOpen(true)} className="text-xs font-semibold shrink-0" style={{ color: 'var(--brand-accent)' }}>Change</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FaStore className="mt-0.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Pick-up Location</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {restaurantDetail?.name || cartItems[0]?.restaurantName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{restaurantDetail?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <FaClock className="shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Estimated preparation time: <span className="font-semibold" style={{ color: 'var(--ink)' }}>{restaurantDetail?.avg_delivery_time || '15-20 minutes'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Voucher */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              {appliedVoucher ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FaCheckCircle className="text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>{appliedVoucher.code} applied</p>
                      <p className="text-xs text-emerald-600 font-semibold">-${appliedVoucher.discount_amount.toFixed(2)} discount</p>
                    </div>
                  </div>
                  <button onClick={removeVoucher} className="text-xs font-semibold text-red-500 flex items-center gap-1 shrink-0">
                    <FaTimesCircle /> Remove
                  </button>
                </div>
              ) : voucherOpen ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(event) => { setVoucherInput(event.target.value.toUpperCase()); setVoucherError(''); }}
                      placeholder="Enter voucher code"
                      className="app-input flex-1 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={applyVoucher}
                      disabled={voucherApplying || !voucherInput.trim()}
                      className="app-button-primary px-4 text-sm font-semibold disabled:opacity-50"
                    >
                      {voucherApplying ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {voucherError && <p className="text-xs text-red-600">{voucherError}</p>}
                  <button onClick={() => { setVoucherOpen(false); setVoucherError(''); }} className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setVoucherOpen(true)} className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--brand-accent)' }}>
                  <FaTicketAlt /> Add voucher
                </button>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>Payment Method</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ id, label, description, icon: Icon }) => (
                  <label
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition"
                    style={paymentMethod === id ? { borderColor: 'var(--brand-accent)', background: '#eff6ff' } : { borderColor: 'var(--line)' }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--brand-navy)' }}
                    />
                    <Icon className="text-lg shrink-0" style={{ color: 'var(--brand-navy)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>Subtotal</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span className="flex items-center gap-1.5"><MdDeliveryDining /> Delivery Fee</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>Service Fee</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>${serviceFee.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex justify-between text-lg font-bold">
                    <span style={{ color: 'var(--ink)' }}>Total</span>
                    <span style={{ color: 'var(--brand-navy)' }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {submitError && (
                <p className="mt-4 text-sm rounded-lg p-3 bg-red-50 text-red-700">{submitError}</p>
              )}

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="hidden lg:block app-button-primary w-full mt-5 py-3.5 font-bold text-base disabled:opacity-60"
              >
                {isSubmitting ? 'Placing order...' : 'CHECKOUT'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Total</p>
            <p className="text-lg font-bold" style={{ color: 'var(--brand-navy)' }}>${total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="app-button-primary flex-1 max-w-[220px] py-3 font-bold text-sm disabled:opacity-60"
          >
            {isSubmitting ? 'Placing order...' : 'CHECKOUT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
