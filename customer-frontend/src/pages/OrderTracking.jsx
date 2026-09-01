import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaTruck, FaStore, FaUtensils, FaHome, FaBox } from 'react-icons/fa';

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
  const [estimatedTime, setEstimatedTime] = useState(15);

  useEffect(() => {
    // ធ្វើ Simulation ប្តូរ Step រៀងរាល់ ៥ វិនាទី (សម្រាប់ការ Test)
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep < STEPS.length) {
          return prevStep + 1;
        }
        clearInterval(interval);
        return prevStep;
      });
    }, 5000); // ៥ វិនាទីដូរ ១ ដំណាក់កាល (អ្នកអាចប្តូរជា 60000 = 1 នាទី)

    return () => clearInterval(interval);
  }, []);

  // គណនាពេលវេលាដែលនៅសល់ (Estimated Minutes)
  useEffect(() => {
    const remaining = Math.max(0, 25 - currentStep * 4);
    setEstimatedTime(remaining);
  }, [currentStep]);

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