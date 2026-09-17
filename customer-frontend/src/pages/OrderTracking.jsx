import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaTruck, FaStore, FaMapMarkerAlt } from 'react-icons/fa';
import { apiRequest } from '../api/app';

const DELIVERY_STEPS = [
  { id: 1, title: 'Order Placed', desc: 'We received your order' },
  { id: 2, title: 'Restaurant Accepted', desc: 'They confirmed your order' },
  { id: 3, title: 'Preparing', desc: 'The kitchen is on it' },
  { id: 4, title: 'Ready for Pickup', desc: 'Almost there...' },
  { id: 5, title: 'Out for Delivery', desc: 'Your rider is on the way' },
  { id: 6, title: 'Delivered', desc: 'Enjoy your meal!' },
];

// Pickup orders never involve a rider, so they skip straight from "ready"
// to "completed" instead of the delivering/delivered steps above.
const PICKUP_STEPS = [
  { id: 1, title: 'Order Placed', desc: 'We received your order' },
  { id: 2, title: 'Restaurant Accepted', desc: 'They confirmed your order' },
  { id: 3, title: 'Preparing', desc: 'The kitchen is on it' },
  { id: 4, title: 'Ready for Pickup', desc: 'Head to the restaurant to collect it' },
  { id: 5, title: 'Picked Up', desc: 'Enjoy your meal!' },
];

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const [currentStep, setCurrentStep] = useState(1);
  const [apiError, setApiError] = useState('');
  const [orderType, setOrderType] = useState(order?.orderType || 'delivery');
  const [restaurant, setRestaurant] = useState(order?.pickupLocation || null);

  const isPickup = orderType === 'pickup';
  const steps = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const estimatedTime = Math.max(0, (isPickup ? 20 : 25) - currentStep * 4);

  const statusToStep = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'completed' || normalizedStatus === 'delivered') return steps.length;
    if (normalizedStatus === 'delivering' || normalizedStatus === 'out_for_delivery') return isPickup ? 4 : 5;
    if (normalizedStatus === 'ready') return 4;
    if (normalizedStatus === 'preparing') return 3;
    if (normalizedStatus === 'accepted') return 2;
    return 1;
  };

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
          if (type === 'pickup' && data.restaurant) {
            setRestaurant({ name: data.restaurant.name, address: data.restaurant.address });
          }
          setCurrentStep(statusToStep(data.status));
          setApiError('');
        }
      } catch (error) {
        if (isMounted) setApiError(error.message || 'Unable to load order status.');
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
        <div className="bg-[#0B1F3B] text-white p-6 flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-white/80">
              {isPickup ? 'Estimated Ready Time' : 'Estimated Arrival'}
            </p>
            <h2 className="text-3xl font-bold my-1">
              {currentStep === steps.length
                ? (isPickup ? 'Picked Up!' : 'Arrived!')
                : `About ${estimatedTime} mins away`}
            </h2>
          </div>
          <div className="w-14 h-14 bg-white/15 flex items-center justify-center">
            {isPickup ? <FaStore className="text-3xl text-white" /> : <FaTruck className="text-3xl text-white" />}
          </div>
        </div>

        {isPickup && (restaurant?.name || restaurant?.address) && (
          <div className="mb-6 flex items-start gap-3 bg-[#EEF2F8] border border-[#D6DBE3] px-4 py-3">
            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[#0B1F3B]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0B1F3B]">Pickup Location</p>
              {restaurant?.name && <p className="text-sm font-bold text-[#1A2233]">{restaurant.name}</p>}
              {restaurant?.address && <p className="text-sm text-slate-600">{restaurant.address}</p>}
            </div>
          </div>
        )}

        {apiError && (
          <p className="mb-6 bg-[#FBEEEC] border border-[#F0D5CF] px-4 py-3 text-sm text-[#A6321E]">{apiError}</p>
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
                      Current status
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
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;