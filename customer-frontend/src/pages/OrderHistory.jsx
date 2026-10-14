import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHistory, FaCalendar, FaMapMarkerAlt, FaPhone, FaCreditCard, FaMoneyBillWave, FaQrcode, FaChevronDown, FaChevronUp, FaShoppingBag, FaStar } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';
import api from '../api/axios';
import { fetchOrderFoodReviews } from '../api/reviewApi';
import OrderFoodRating from '../components/OrderFoodRating';

// Maps a raw order.status value to the orderPages.* key that has its label.
// pending/delivered reuse the filter-button labels; the rest were only ever
// shown here, in the status badge, with their own keys.
const STATUS_LABEL_KEYS = {
  pending: 'orderPages.statusPendingRestaurant',
  accepted: 'orderPages.statusAccepted',
  preparing: 'orderPages.statusPreparing',
  ready: 'orderPages.statusReady',
  delivering: 'orderPages.statusDelivering',
  delivered: 'orderPages.delivered',
  completed: 'orderPages.statusCompleted',
  cancelled: 'orderPages.statusCancelled',
};

// A dish can only be rated once the order actually reached the customer -
// the same rule the API enforces through OrderStatuses::SETTLED
// (delivered/completed). A cancelled or still-in-flight order is not rateable.
const RATEABLE_STATUSES = ['delivered', 'completed'];

const OrderHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  // Ratings the customer already left, per order and then per dish:
  // { [orderId]: { [foodId]: review } }. Loaded lazily when an order is opened.
  const [ratings, setRatings] = useState({});

  const getStatusLabel = (status) => {
    // Filter buckets that aren't a single status (see STATUS_FILTERS below).
    if (status === 'active') return t('orderPages.statusInProgress');
    const key = STATUS_LABEL_KEYS[status];
    return key ? t(key) : status;
  };

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
        const normalizedOrders = apiOrders.map((order) => {
          // The API returns a full item breakdown (price/image/category) in
          // items_detail; older/cached orders only have the display string
          // in items, so fall back to a bare name with no price/image.
          const items = Array.isArray(order.items_detail)
            ? order.items_detail.map((item) => ({
                ...item,
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1,
              }))
            : Array.isArray(order.items)
              ? order.items
              : order.items
                ? [{ name: order.items, quantity: 1, price: 0 }]
                : [];

          return {
            ...order,
            date: order.created_at || order.date || new Date().toISOString(),
            total: Number(String(order.total || order.price || '0').replace(/[^0-9.]/g, '')) || 0,
            subtotal: Number(order.subtotal) || 0,
            delivery: Number(order.delivery_fee ?? order.delivery) || 0,
            status: String(order.status || 'placed').toLowerCase(),
            items,
            customerInfo: order.customerInfo || {
              fullName: order.customer || 'Guest Customer',
              phone: order.phone || '',
              address: order.address || '',
              city: '',
              paymentMethod: order.payment_method || 'cash',
            },
          };
        });
        setOrders(normalizedOrders);
      } catch (error) {
        console.error('Error fetching order history:', error);
        const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(storedOrders.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    };

    loadOrders();
  }, [navigate]);

  // The API needs the numeric order id; the list shows a padded "#BR-0001"
  // label in `id`, so only `real_id` can address the order. Locally cached
  // orders have no `real_id` and therefore cannot be rated.
  const getApiOrderId = (order) => order.real_id;

  // A dish can only be rated once the order was delivered, and only dishes
  // that carry a real food id can be addressed at the API.
  const isRateable = (order) => RATEABLE_STATUSES.includes(order.status) && Boolean(getApiOrderId(order));

  const loadRatings = async (orderId) => {
    try {
      const reviews = await fetchOrderFoodReviews(orderId);
      const byFoodId = {};
      reviews.forEach((review) => {
        if (review?.food_id) byFoodId[review.food_id] = review;
      });
      setRatings((previous) => ({ ...previous, [orderId]: byFoodId }));
    } catch (error) {
      // A failed lookup must not hide the order - the rating form still works,
      // it just starts from "not rated yet" until the next open.
      console.error('Error fetching food ratings:', error);
    }
  };

  const toggleOrderExpand = (order) => {
    const wasExpanded = expandedOrders.includes(order.id);

    setExpandedOrders(prev =>
      wasExpanded
        ? prev.filter(id => id !== order.id)
        : [...prev, order.id]
    );

    // Ratings are only needed for a finished order, and only once its details
    // are actually on screen.
    if (!wasExpanded && isRateable(order)) {
      loadRatings(getApiOrderId(order));
    }
  };

  const handleRatingSaved = (orderId, foodId, review) => {
    if (!foodId) return;
    setRatings((previous) => ({
      ...previous,
      [orderId]: { ...(previous[orderId] || {}), [foodId]: review },
    }));
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
      case 'accepted':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'preparing':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'ready':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'delivering':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'delivered':
      case 'completed':
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
      case 'completed':
        return '✓';
      case 'cancelled':
        return '✗';
      default:
        return '⋯';
    }
  };

  // A filter bucket groups the statuses the customer thinks of together; the
  // lifecycle itself is: pending -> accepted -> preparing -> ready ->
  // delivering -> delivered (or cancelled at any point before delivery).
  const STATUS_FILTERS = {
    all: null,
    active: ['accepted', 'preparing', 'ready', 'delivering'],
    pending: ['pending'],
    delivered: ['delivered', 'completed'],
    cancelled: ['cancelled'],
  };

  const filteredOrders = (() => {
    const bucket = STATUS_FILTERS[filterStatus];
    if (!bucket) return orders;
    return orders.filter((order) => bucket.includes(order.status));
  })();

  if (orders.length === 0) {
    return (
      <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 font-sans rounded-none">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 border-b border-slate-300 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-2">
              {t('orderPages.title')}
            </h1>
            <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">{t('orderPages.pastOrders')}</p>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-300 rounded-none shadow-sm">
            <div className="w-24 h-24 bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 rounded-none">
              <FaHistory className="text-4xl text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">{t('orderPages.noOrders')}</h2>
            <p className="text-slate-500 mb-8 text-center max-w-md text-sm font-medium">
              {t('orderPages.noOrdersMessage')}
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-none font-bold uppercase tracking-wider transition-colors border border-blue-950 shadow-sm"
            >
              {t('orderPages.browseMenu')}
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
            {t('orderPages.title')}
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {orders.length} {t('orderPages.totalOrder', { count: orders.length })} {t('orderPages.found')}
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
              {t('orderPages.allOrders')} ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'pending'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t('orderPages.pending')}
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'active'
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t('orderPages.statusInProgress')}
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'delivered'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t('orderPages.delivered')}
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-none transition-colors border ${
                filterStatus === 'cancelled'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {t('orderPages.statusCancelled')}
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id);
            const showRatings = isRateable(order);
            const itemRating = (item) => ratings[getApiOrderId(order)]?.[item.food_id];
            // Unrated dishes are only known once the ratings have been loaded,
            // so before that the whole order counts as still waiting.
            const pendingRatingCount = (target) => {
              if (!isRateable(target)) return 0;
              const rateableItems = target.items.filter((item) => item.food_id);
              if (!rateableItems.length) return 0;
              const saved = ratings[getApiOrderId(target)];
              return saved
                ? rateableItems.filter((item) => !saved[item.food_id]).length
                : rateableItems.length;
            };

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-300 rounded-none shadow-sm transition-colors duration-200"
              >
                {/* Order Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleOrderExpand(order)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-none flex items-center justify-center shrink-0">
                        <FaShoppingBag className="text-slate-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">{t('orderPages.order')} #{order.id}</h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                          <FaCalendar className="text-slate-400" />
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-slate-100 sm:border-none pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <span className={`px-3 py-1.5 rounded-none font-bold text-[10px] uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {getStatusLabel(order.status)}
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
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('orderPages.totalItems')}</p>
                        <p className="text-base font-bold text-slate-900">{order.items.length}</p>
                      </div>
                      <div className="h-10 w-px bg-slate-300"></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('orderPages.totalAmount')}</p>
                        <p className="text-base font-bold text-blue-900">${order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Nudge: a finished order whose dishes are not all rated yet */}
                    {showRatings && pendingRatingCount(order) > 0 && (
                      <span className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-900">
                        <FaStar className="text-amber-500" />
                        {/* The exact number is only trustworthy once the ratings
                            have been fetched, which happens on first expand. */}
                        {ratings[getApiOrderId(order)]
                          ? t('orderPages.ratingPendingCount', { count: pendingRatingCount(order) })
                          : t('orderPages.rateYourFood')}
                      </span>
                    )}

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
                    
                    {/* Food Rating lead-in - the controls themselves sit inside
                        the matching dish below, so this only introduces them. */}
                    {showRatings && (
                      <div className="p-6 border-b border-slate-200 bg-white">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-2 border-b border-slate-200 pb-2">
                          <FaStar className="text-amber-400" />
                          {t('orderPages.rateYourFood')}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {t('orderPages.rateFoodHint')}
                        </p>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="p-6 border-b border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">{t('orderPages.orderItems')}</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={`${item.id}-${item.type}-${index}`}
                            className="p-4 bg-white rounded-none border border-slate-200 shadow-sm"
                          >
                            <div className="flex gap-4">
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

                            {showRatings && item.food_id && (
                              <OrderFoodRating
                                orderId={getApiOrderId(order)}
                                foodId={item.food_id}
                                foodName={item.name}
                                review={itemRating(item)}
                                onSaved={(review) => handleRatingSaved(getApiOrderId(order), item.food_id, review)}
                              />
                            )}
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
                          {t('orderPages.deliveryDetails')}
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <FaPhone className="text-slate-400 mt-0.5 text-sm" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{t('orderPages.contactName')}</p>
                              <p className="text-xs font-bold text-slate-900">{order.customerInfo.fullName}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FaPhone className="text-slate-400 mt-0.5 text-sm" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{t('orderPages.phoneNumber')}</p>
                              <p className="text-xs font-bold text-slate-900">{order.customerInfo.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <FaMapMarkerAlt className="text-slate-400 mt-0.5 text-sm" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{t('orderPages.deliveryAddress')}</p>
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
                          {t('orderPages.paymentMethod')}
                        </h4>
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-none">
                          <div className="flex items-center gap-4">
                            {order.customerInfo.paymentMethod === 'cash' ? (
                              <>
                                <FaMoneyBillWave className="text-2xl text-emerald-700" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">{t('orderPages.cashOnDelivery')}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('orderPages.payUponReceipt')}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <FaQrcode className="text-2xl text-blue-900" />
                                <div>
                                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">KHQR</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('orderPages.paidOnline')}</p>
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
                          <span>{t('orderPages.subtotal')}</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <MdDeliveryDining className="text-sm" />
                            {t('orderPages.deliveryFee')}
                          </span>
                          <span>${order.delivery.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-300 pt-3 mt-3">
                          <div className="flex justify-between text-base font-bold uppercase tracking-wide">
                            <span className="text-slate-900">{t('orderPages.total')}</span>
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
                        <FaShoppingBag /> {t('orderPages.reorder')}
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
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('orderPages.noStatusOrders', { status: getStatusLabel(filterStatus) })}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;