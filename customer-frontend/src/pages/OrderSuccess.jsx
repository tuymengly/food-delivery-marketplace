import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaMapMarkerAlt, FaPhone, FaUser, FaCreditCard, FaMoneyBillWave, FaQrcode, FaHome, FaList, FaTruck } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';

const getPaymentMethodLabels = (t) => ({
  cash: { label: t('orderPages.cashOnDelivery'), description: t('orderPages.payUponReceipt'), icon: FaMoneyBillWave, color: 'text-emerald-700' },
  khqr: { label: 'KHQR', description: t('orderPages.paymentCompleted'), icon: FaQrcode, color: 'text-blue-900' },
});

const readStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getSavedOrder = () => {
  const orders = readStoredJson('orders', []);
  const lastOrderId = localStorage.getItem('lastOrderId');

  return Array.isArray(orders)
    ? orders.find((order) => String(order.id) === lastOrderId) || null
    : null;
};

const OrderSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData] = useState(() => location.state?.order || getSavedOrder());

  useEffect(() => {
    if (!orderData) {
      navigate('/');
    }
  }, [navigate, orderData]);

  if (!orderData) {
    return (
      <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 flex items-center justify-center font-sans rounded-none">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-slate-300 border-t-blue-900 mx-auto mb-4 rounded-none"></div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{t('orderPages.loadingDetails')}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase();
  };

  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const customerInfo = orderData.customerInfo || {};
  const subtotal = Number(orderData.subtotal) || 0;
  const delivery = Number(orderData.delivery) || 0;
  const total = Number(orderData.total) || 0;
  const isPickup = orderData.orderType === 'pickup';
  const pickupLocation = orderData.pickupLocation || {};

  return (
    <div className="w-full min-h-screen bg-slate-100 pt-24 pb-16 px-6 md:px-14 font-sans rounded-none">
      <div className="max-w-4xl mx-auto">
        
        {/* Success Header */}
        <div className="bg-white border border-slate-300 rounded-none shadow-sm p-8 md:p-12 mb-6">
          <div className="text-center mb-8 border-b border-slate-200 pb-8">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6 rounded-none">
              <FaCheckCircle className="text-3xl text-emerald-700" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-3">
              {t('orderPages.confirmed')}
            </h1>
            <p className="text-sm font-medium text-slate-600 mb-8">
              {t('orderPages.confirmedMessage')}
            </p>
            <div className="inline-block bg-slate-50 border border-slate-300 px-8 py-4 rounded-none">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('orderPages.transactionId')}</p>
              <p className="text-2xl font-bold text-blue-900">#{orderData.id}</p>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-5 uppercase tracking-wider">{formatDate(orderData.date)}</p>
          </div>

          {/* Order Status */}
          <div className="bg-slate-50 border border-slate-300 rounded-none p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <MdDeliveryDining className="text-2xl text-blue-900" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {isPickup ? t('orderPages.estimatedPickup') : t('orderPages.estimatedDelivery')}
              </p>
            </div>
            <p className="text-2xl font-extrabold text-blue-900 uppercase tracking-tight">
              {isPickup ? t('orderPages.pickupMinutes') : t('orderPages.deliveryMinutes')}
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-slate-300 rounded-none shadow-sm p-8 md:p-10 mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-4 mb-6 flex items-center gap-3">
            <FaList className="text-slate-400" />
            {t('orderPages.details')}
          </h2>

          {/* Ordered Items */}
          <div className="space-y-0 mb-8 border-b border-slate-200">
            {items.map((item, index) => (
              <div
                key={`${item.id}-${item.type}-${index}`}
                className="flex gap-4 py-4 border-t border-slate-100 first:border-0"
              >
                <div className="w-16 h-16 flex-shrink-0 bg-slate-100 border border-slate-200 rounded-none">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-none"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{item.name}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      ${Number(item.price || 0).toFixed(2)} × {item.quantity}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="max-w-sm ml-auto space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>{t('orderPages.subtotal')}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <MdDeliveryDining className="text-sm" />
                {t('orderPages.deliveryFee')}
              </span>
              <span>${delivery.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-300 pt-3 mt-3">
              <div className="flex justify-between text-base font-bold uppercase tracking-wide">
                <span className="text-slate-900">{t('orderPages.totalSettled')}</span>
                <span className="text-blue-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white border border-slate-300 rounded-none shadow-sm p-8 md:p-10 mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-4 mb-6 flex items-center gap-3">
            <FaUser className="text-slate-400" />
            {t('orderPages.customerInformation')}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-none flex items-start gap-4">
              <FaUser className="text-slate-400 text-lg mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('orderPages.fullName')}</p>
                <p className="text-sm font-bold text-slate-900">{customerInfo.fullName}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-none flex items-start gap-4">
              <FaPhone className="text-slate-400 text-lg mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('orderPages.contactNumber')}</p>
                <p className="text-sm font-bold text-slate-900">{customerInfo.phone}</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-none flex items-start gap-4">
              <FaMapMarkerAlt className="text-slate-400 text-lg mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {isPickup ? t('orderPages.pickupLocation') : t('orderPages.deliveryAddress')}
                </p>
                {isPickup ? (
                  <>
                    <p className="text-sm font-bold text-slate-900 leading-relaxed">{pickupLocation.name || customerInfo.address}</p>
                    {pickupLocation.address && (
                      <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">{pickupLocation.address}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {customerInfo.address}, {customerInfo.city}
                  </p>
                )}
              </div>
            </div>

            {customerInfo.notes && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-5 rounded-none flex items-start gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1">{t('orderPages.deliveryInstructions')}</p>
                  <p className="text-sm font-medium text-slate-800">{customerInfo.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-slate-300 rounded-none shadow-sm p-8 md:p-10 mb-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-4 mb-6 flex items-center gap-3">
            <FaCreditCard className="text-slate-400" />
            {t('orderPages.paymentDetails')}
          </h2>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-none flex items-center gap-4">
            {(() => {
              const paymentMethodLabels = getPaymentMethodLabels(t);
              const method = paymentMethodLabels[customerInfo.paymentMethod] || paymentMethodLabels.cash;
              const Icon = method.icon;
              return (
                <>
                  <Icon className={`text-3xl ${method.color}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">{method.label}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{method.description}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/order-tracking', { state: { order: orderData } })}
            className="bg-blue-900 hover:bg-blue-950 text-white py-3.5 px-4 rounded-none text-[11px] font-bold uppercase tracking-wider border border-blue-950 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FaTruck size={14} />
            {t('orderPages.trackOrder')}
          </button>

          <button
            onClick={() => navigate('/order-history')}
            className="bg-slate-800 hover:bg-slate-900 text-white py-3.5 px-4 rounded-none text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FaList size={14} />
            {t('orderPages.orderHistory')}
          </button>

          <button
            onClick={() => navigate('/menu')}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 py-3.5 px-4 rounded-none text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center shadow-sm"
          >
            {t('orderPages.newOrder')}
          </button>

          <button
            onClick={() => navigate('/')}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 py-3.5 px-4 rounded-none text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FaHome size={14} />
            {t('orderPages.returnHome')}
          </button>
        </div>

        {/* Formal Footer Note */}
        <div className="mt-8 bg-slate-50 border border-slate-300 rounded-none p-6 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {t('orderPages.receiptEnd')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;