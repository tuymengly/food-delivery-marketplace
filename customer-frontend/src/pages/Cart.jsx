import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaShoppingCart, FaTrash, FaMinus, FaPlus, FaStar, FaRegStar,
  FaMapMarkerAlt, FaStore, FaClock, FaTicketAlt, FaTimesCircle,
  FaMoneyBillWave, FaQrcode, FaCheckCircle,
} from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';
import { clearCart as clearApiCart, fetchCart, removeCartItem, toggleFoodRecommendation, updateCartItem } from '../api/foodApi';
import { fetchRestaurant } from '../api/restaurantApi';
import { validateVoucher } from '../api/voucherApi';
import { createOrder, createKhqrPayment, getStoredUser } from '../api/app';
import { getStoredLocation } from '../utils/location';
import Toast from '../components/Toast';
import AddressPickerModal from '../components/AddressPickerModal';

const DELIVERY_FEE = 1.5;
const SERVICE_FEE = 0.3;

const PAYMENT_METHODS = [
  { id: 'cash', labelKey: 'cartFlow.paymentCash', descriptionKey: 'cartFlow.paymentCashDesc', icon: FaMoneyBillWave },
  { id: 'khqr', label: 'KHQR', descriptionKey: 'cartFlow.paymentKhqrDesc', icon: FaQrcode },
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
  const { t } = useTranslation();
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
      showToast(error.response?.data?.message || t('cartFlow.updateRecommendationError'));
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
      setVoucherError(error.response?.data?.message || t('cartFlow.voucherApplyError'));
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
    if (cartItems.length === 0) return t('cartFlow.emptyValidation');
    if (hasMultipleRestaurants) return t('cartFlow.singleRestaurantValidation');
    if (orderType === 'delivery' && !selectedLocation?.addressId) return t('cartFlow.addressValidation');
    if (!paymentMethod) return t('cartFlow.paymentValidation');
    return null;
  };

  const handleCheckout = async () => {
    const validationMessage = validateBeforeCheckout();
    if (validationMessage) {
      setSubmitError(validationMessage);
      if (validationMessage === t('cartFlow.addressValidation')) setAddressModalOpen(true);
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
      setSubmitError(describeApiError(error, t('cartFlow.placeOrderError')));
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
          : t('cartFlow.pickupAt', { name: restaurantDetail?.name || cartItems[0]?.restaurantName || t('cartFlow.restaurantFallback') }),
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

    if (paymentMethod === 'khqr' && savedOrder?.id) {
      try {
        const paymentResponse = await createKhqrPayment(savedOrder.id);
        const payment = paymentResponse.data;
        setIsSubmitting(false);
        navigate(`/payment/khqr/${payment.id}`, { state: { payment, order } });
        return;
      } catch (error) {
        setSubmitError(describeApiError(error, t('cartFlow.khqrStartError')));
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
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>{t('cartFlow.emptyTitle')}</h1>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>{t('cartFlow.emptySubtitle')}</p>
          <Link to="/shops" className="app-button-primary inline-block px-8 py-3.5 font-semibold">
            {t('cartFlow.browseRestaurants')}
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
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--brand-navy)' }}>{t('cartFlow.title')}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {t('cartFlow.from')}: <span className="font-semibold" style={{ color: 'var(--ink)' }}>{cartItems[0]?.restaurantName || t('cartFlow.restaurant')}</span>
              {' · '}{cartItems.length} {t('cartFlow.item', { count: cartItems.length })}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 hover:border-red-300 hover:text-red-600 transition"
            style={{ color: 'var(--muted)' }}
          >
            {t('cartFlow.clearCart')}
          </button>
        </div>

        {hasMultipleRestaurants && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              {t('cartFlow.multiRestaurantWarning')}
            </p>
            <div className="flex flex-wrap gap-2">
              {restaurantGroups.map((group) => (
                <button
                  key={group.restaurantId}
                  onClick={() => removeRestaurantGroup(group.restaurantId)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 transition"
                >
                  {t('cartFlow.removeItemsFrom', { name: group.name || t('cartFlow.thisRestaurant') })}
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
                          title={isRecommended(item) ? t('cartFlow.removeRecommendation') : t('cartFlow.recommendFood')}
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
                          aria-label={t('cartFlow.removeItem', { name: item.name })}
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
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>{t('cartFlow.specialInstructions')}</h3>
              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={t('cartFlow.instructionsPlaceholder')}
                    className="app-input w-full p-3 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveNotes} className="app-button-primary px-5 py-2 text-sm font-semibold">{t('common.save')}</button>
                    <button onClick={cancelNotes} className="px-5 py-2 text-sm font-semibold rounded-md border border-slate-200" style={{ color: 'var(--muted)' }}>{t('common.cancel')}</button>
                  </div>
                </div>
              ) : notes ? (
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm italic" style={{ color: 'var(--ink)' }}>"{notes}"</p>
                  <button onClick={() => { setNotesDraft(notes); setEditingNotes(true); }} className="text-xs font-semibold shrink-0" style={{ color: 'var(--brand-accent)' }}>{t('common.edit')}</button>
                </div>
              ) : (
                <button
                  onClick={() => { setNotesDraft(''); setEditingNotes(true); }}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--brand-accent)' }}
                >
                  {t('cartFlow.addInstructions')}
                </button>
              )}
            </div>
          </div>

          {/* Right: order type, address, voucher, payment, summary, checkout */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Order type */}
            <div className="bg-white cursor-pointer rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>{t('cartFlow.orderType')}</h3>
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
                    {type === 'pickup' ? t('cartFlow.pickup') : t('cartFlow.delivery')}
                  </button>
                ))}
              </div>

              {orderType === 'delivery' ? (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <FaMapMarkerAlt className="mt-0.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('cartFlow.deliveryAddress')}</p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {selectedLocation?.address || t('cartFlow.noAddress')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setAddressModalOpen(true)} className="text-xs font-semibold shrink-0" style={{ color: 'var(--brand-accent)' }}>{t('cartFlow.change')}</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FaStore className="mt-0.5 shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('cartFlow.pickupLocation')}</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {restaurantDetail?.name || cartItems[0]?.restaurantName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{restaurantDetail?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <FaClock className="shrink-0" style={{ color: 'var(--brand-accent)' }} />
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {t('cartFlow.estimatedPrep')} <span className="font-semibold" style={{ color: 'var(--ink)' }}>{restaurantDetail?.avg_delivery_time || t('cartFlow.prepFallback')}</span>
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
                      placeholder={t('cartFlow.voucherPlaceholder')}
                      className="app-input flex-1 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={applyVoucher}
                      disabled={voucherApplying || !voucherInput.trim()}
                      className="app-button-primary px-4 text-sm font-semibold disabled:opacity-50"
                    >
                      {voucherApplying ? t('cartFlow.checking') : t('cartFlow.apply')}
                    </button>
                  </div>
                  {voucherError && <p className="text-xs text-red-600">{voucherError}</p>}
                  <button onClick={() => { setVoucherOpen(false); setVoucherError(''); }} className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('common.cancel')}</button>
                </div>
              ) : (
                <button onClick={() => setVoucherOpen(true)} className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--brand-accent)' }}>
                  <FaTicketAlt /> {t('cartFlow.addVoucher')}
                </button>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>{t('cartFlow.paymentMethod')}</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(({ id, label, labelKey, descriptionKey, icon: Icon }) => (
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
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labelKey ? t(labelKey) : label}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{t(descriptionKey)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>{t('cartFlow.orderSummary')}</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>{t('cartFlow.subtotal')}</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span className="flex items-center gap-1.5"><MdDeliveryDining /> {t('cartFlow.deliveryFee')}</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--muted)' }}>
                  <span>{t('cartFlow.serviceFee')}</span>
                  <span className="font-semibold" style={{ color: 'var(--ink)' }}>${serviceFee.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{t('cartFlow.discount')}</span>
                    <span className="font-semibold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-1" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex justify-between text-lg font-bold">
                    <span style={{ color: 'var(--ink)' }}>{t('cartFlow.total')}</span>
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
                {isSubmitting ? t('cartFlow.placingOrder') : t('cartFlow.checkout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{t('cartFlow.total')}</p>
            <p className="text-lg font-bold" style={{ color: 'var(--brand-navy)' }}>${total.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="app-button-primary flex-1 max-w-[220px] py-3 font-bold text-sm disabled:opacity-60"
          >
            {isSubmitting ? t('cartFlow.placingOrder') : t('cartFlow.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
