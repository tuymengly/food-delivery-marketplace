import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTruck, FaStore, FaMapMarkerAlt } from 'react-icons/fa';
import { apiRequest } from '../api/app';
import DeliveryTrackingMap from '../components/DeliveryTrackingMap';

const getDeliverySteps = (t) => [
  { id: 1, title: t('orderTracking.stepOrderPlaced'), desc: t('orderTracking.stepOrderPlacedDesc') },
  { id: 2, title: t('orderTracking.stepAccepted'), desc: t('orderTracking.stepAcceptedDesc') },
  { id: 3, title: t('orderTracking.stepPreparing'), desc: t('orderTracking.stepPreparingDesc') },
  { id: 4, title: t('orderTracking.stepReadyPickup'), desc: t('orderTracking.stepReadyDeliveryDesc') },
  { id: 5, title: t('orderTracking.stepOutForDelivery'), desc: t('orderTracking.stepOutForDeliveryDesc') },
  { id: 6, title: t('orderTracking.stepDelivered'), desc: t('orderTracking.enjoyMeal') },
];

// Pickup orders never involve a rider, so they skip straight from "ready"
// to "completed" instead of the delivering/delivered steps above.
const getPickupSteps = (t) => [
  { id: 1, title: t('orderTracking.stepOrderPlaced'), desc: t('orderTracking.stepOrderPlacedDesc') },
  { id: 2, title: t('orderTracking.stepAccepted'), desc: t('orderTracking.stepAcceptedDesc') },
  { id: 3, title: t('orderTracking.stepPreparing'), desc: t('orderTracking.stepPreparingDesc') },
  { id: 4, title: t('orderTracking.stepReadyPickup'), desc: t('orderTracking.stepReadyPickupDesc') },
  { id: 5, title: t('orderTracking.stepPickedUp'), desc: t('orderTracking.enjoyMeal') },
];

const OrderTracking = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const [currentStep, setCurrentStep] = useState(1);
  const [apiError, setApiError] = useState('');
  const [orderType, setOrderType] = useState(order?.orderType || 'delivery');
  const [restaurant, setRestaurant] = useState(order?.pickupLocation || null);
  const [delivery, setDelivery] = useState(null);
  const [address, setAddress] = useState(null);
  const [orderStatus, setOrderStatus] = useState('pending');

  const isPickup = orderType === 'pickup';
  const isCancelled = orderStatus === 'cancelled';
  const steps = isPickup ? getPickupSteps(t) : getDeliverySteps(t);
  const estimatedTime = Math.max(0, (isPickup ? 20 : 25) - currentStep * 4);

  // The customer-facing lifecycle the backend writes to orders.status:
  // pending -> accepted -> preparing -> ready -> delivering -> delivered.
  const statusToStep = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'completed' || normalizedStatus === 'delivered') return steps.length;
    if (normalizedStatus === 'delivering' || normalizedStatus === 'out_for_delivery') return isPickup ? 4 : 5;
    if (normalizedStatus === 'ready') return 4;
    if (normalizedStatus === 'preparing') return 3;
    if (normalizedStatus === 'accepted') return 2;
    return 1;
  };

  // Where the delivery itself is - a rider can already be assigned while the
  // order is still sitting at "ready for pickup".
  const deliveryStatus = String(delivery?.status || '').toLowerCase();
  const riderAssigned = Boolean(delivery?.rider_id) && ['assigned', 'picked_up', 'delivering'].includes(deliveryStatus);

  const deliveryStageLabel = {
    pending: t('orderTracking.stageWaitingForRider'),
    assigned: t('orderTracking.stageRiderAssigned'),
    picked_up: t('orderTracking.stagePickedUp'),
    delivering: t('orderTracking.stageOnTheWay'),
    delivered: t('orderTracking.stageDelivered'),
    cancelled: t('orderTracking.stageCancelled'),
  }[deliveryStatus] || null;

  useEffect(() => {
    const orderId = order?.remoteId || order?.real_id || order?.id;
    if (!orderId || !localStorage.getItem('token')) return undefined;

    let isMounted = true;
    const loadOrder = async () => {
      try {
        const response = await apiRequest(`/orders/${orderId}`);
        const data = response?.data;
        if (isMounted && data) {
          const type = data.order_type || 'delivery';
          setOrderType(type);
          if (data.restaurant) {
            setRestaurant({
              name: data.restaurant.name,
              address: data.restaurant.address,
              latitude: data.restaurant.latitude,
              longitude: data.restaurant.longitude,
            });
          }
          setDelivery(data.delivery || null);
          setAddress(data.address || null);
          setOrderStatus(String(data.status || 'pending').toLowerCase());
          setCurrentStep(statusToStep(data.status));
          setApiError('');
        }
      } catch (error) {
        if (isMounted) setApiError(error.message || t('orderTracking.loadError'));
      }
    };

    loadOrder();
    const interval = setInterval(loadOrder, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return (
    <div className="w-full min-h-screen bg-[#F4F5F7] pt-24 pb-16 px-4 md:px-14 flex justify-center">
      <div className="w-full max-w-lg bg-white shadow-2xl p-6 border border-[#D6DBE3]">
        
        {/* Top Header Card */}
        <div className={`text-white p-6 flex items-center justify-between mb-8 ${isCancelled ? 'bg-[#A6321E]' : 'bg-[#0B1F3B]'}`}>
          <div>
            <p className="text-sm font-medium text-white/80">
              {isCancelled
                ? t('orderTracking.orderCancelled')
                : isPickup
                  ? t('orderTracking.estimatedReadyTime')
                  : t('orderTracking.estimatedArrival')}
            </p>
            <h2 className="text-3xl font-bold my-1">
              {isCancelled
                ? t('orderTracking.notDelivered')
                : currentStep === steps.length
                  ? (isPickup ? t('orderTracking.pickedUpExclaim') : t('orderTracking.arrivedExclaim'))
                  : t('orderTracking.minsAway', { mins: estimatedTime })}
            </h2>
            {deliveryStageLabel && !isCancelled && (
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{deliveryStageLabel}</p>
            )}
          </div>
          <div className="w-14 h-14 bg-white/15 flex items-center justify-center">
            {isPickup ? <FaStore className="text-3xl text-white" /> : <FaTruck className="text-3xl text-white" />}
          </div>
        </div>

        {isCancelled && (
          <p className="mb-6 bg-[#FBEEEC] border border-[#F0D5CF] px-4 py-3 text-sm text-[#A6321E]">
            {t('orderTracking.cancelledMessage')}
          </p>
        )}

        {!isPickup && riderAssigned && delivery?.rider && (
          <DeliveryTrackingMap
            rider={delivery.rider}
            restaurant={restaurant}
            address={address}
            hasBeenPickedUp={['picked_up', 'delivering', 'delivered'].includes(delivery.status)}
          />
        )}

        {isPickup && (restaurant?.name || restaurant?.address) && (
          <div className="mb-6 flex items-start gap-3 bg-[#EEF2F8] border border-[#D6DBE3] px-4 py-3">
            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[#0B1F3B]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0B1F3B]">{t('orderPages.pickupLocation')}</p>
              {restaurant?.name && <p className="text-sm font-bold text-[#1A2233]">{restaurant.name}</p>}
              {restaurant?.address && <p className="text-sm text-slate-600">{restaurant.address}</p>}
            </div>
          </div>
        )}

        {apiError && (
          <p className="mb-6 bg-[#FBEEEC] border border-[#F0D5CF] px-4 py-3 text-sm text-[#A6321E]">{apiError}</p>
        )}

        {/* The rider is only ever shown once the backend actually assigned this
            order to them (i.e. after the restaurant marked it ready). */}
        {!isPickup && riderAssigned && delivery?.rider && (
          <div className="mb-6 flex items-start gap-3 bg-[#EEF2F8] border border-[#D6DBE3] px-4 py-3">
            <FaTruck className="mt-0.5 shrink-0 text-[#0B1F3B]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0B1F3B]">
                {t('orderTracking.yourRider')}
              </p>
              {delivery.rider.user?.name && (
                <p className="text-sm font-bold text-[#1A2233]">{delivery.rider.user.name}</p>
              )}
              {delivery.rider.phone && <p className="text-sm text-slate-600">{delivery.rider.phone}</p>}
            </div>
          </div>
        )}

        {/* Timeline Steps */}
        <div className="relative pl-6 space-y-8">
          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Connecting Line */}
                {step.id !== steps.length && (
                  <div
                    className={`absolute left-[15px] top-[32px] w-[3px] h-[calc(100%+8px)] -z-0 transition-colors duration-500 ${
                      isDone ? 'bg-[#0B1F3B]' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle / Badge */}
                <div
                  className={`w-8 h-8 flex items-center justify-center z-10 text-sm font-bold transition-all duration-500 ${
                    isDone
                      ? 'bg-[#0B1F3B] text-white'
                      : isCurrent
                      ? 'bg-white border-2 border-[#0B1F3B] text-[#0B1F3B] ring-4 ring-[#EEF2F8]'
                      : 'bg-slate-100 border border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? <FaCheck className="text-xs" /> : step.id}
                </div>

                {/* Step Info */}
                <div className="flex-1">
                  <h4
                    className={`font-bold text-base transition-colors ${
                      isCurrent || isDone ? 'text-[#1A2233]' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                  
                  {isCurrent && (
                    <span className="inline-block mt-2 px-3 py-1 bg-[#EEF2F8] text-[#0B1F3B] font-semibold text-xs animate-pulse">
                      {t('orderTracking.currentStatus')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-8 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 transition-all cursor-pointer"
        >
          {t('orderTracking.backToHome')}
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;