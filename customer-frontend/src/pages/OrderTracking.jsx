import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaTruck, FaStore, FaUtensils, FaHome, FaBox } from 'react-icons/fa';
import { apiRequest } from '../api/app';

// ១. កំណត់បញ្ជី Status ទាំងអស់
const STEPS = [
  { id: 1, title: 'Order Placed', desc: 'We received your order', durationMinutes: 0 },
  { id: 2, title: 'Restaurant Accepted', desc: 'They confirmed your order', durationMinutes: 2 },
  { id: 3, title: 'Preparing', desc: 'The kitchen is on it', durationMinutes: 5 },
  { id: 4, title: 'Ready for Pickup', desc: 'Almost there...', durationMinutes: 10 },
  { id: 5, title: 'Out for Delivery', desc: 'Your rider is on the way', durationMinutes: 15 },
  { id: 6, title: 'Delivered', desc: 'Enjoy your meal!', durationMinutes: 25 },
];

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const [currentStep, setCurrentStep] = useState(1);
  const [apiError, setApiError] = useState('');
  const estimatedTime = Math.max(0, 25 - currentStep * 4);

  const statusToStep = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();

    if (normalizedStatus === 'delivered' || normalizedStatus === 'completed') return 6;
    if (normalizedStatus === 'delivering' || normalizedStatus === 'out_for_delivery') return 5;
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
        if (isMounted) {
          setCurrentStep(statusToStep(response?.data?.status));
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
  }, [order]);

  return (
    <div className="w-full min-h-screen bg-amber-50/40 pt-24 pb-16 px-4 md:px-14 flex justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl flex items-center justify-between mb-8 shadow-md">
          <div>
            <p className="text-sm font-medium opacity-90">Estimated Arrival</p>
            <h2 className="text-3xl font-extrabold my-1">
              {currentStep === 6 ? 'Arrived!' : `About ${estimatedTime} mins away`}
            </h2>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <FaTruck className="text-3xl text-white" />
          </div>
        </div>
        {apiError && (
          <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{apiError}</p>
        )}

        {/* Timeline Steps */}
        <div className="relative pl-6 space-y-8">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Connecting Line */}
                {step.id !== STEPS.length && (
                  <div
                    className={`absolute left-[15px] top-[32px] w-[3px] h-[calc(100%+8px)] -z-0 transition-colors duration-500 ${
                      isDone ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Step Circle / Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 text-sm font-bold transition-all duration-500 ${
                    isDone
                      ? 'bg-orange-500 text-white'
                      : isCurrent
                      ? 'bg-white border-2 border-orange-500 text-orange-500 ring-4 ring-orange-100'
                      : 'bg-gray-100 border border-gray-300 text-gray-400'
                  }`}
                >
                  {isDone ? <FaCheck className="text-xs" /> : step.id}
                </div>

                {/* Step Info */}
                <div className="flex-1">
                  <h4
                    className={`font-bold text-base transition-colors ${
                      isCurrent || isDone ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                  
                  {isCurrent && (
                    <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-600 font-semibold text-xs rounded-full animate-pulse">
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
          className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;