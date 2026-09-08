import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const VARIANTS = {
  success: {
    border: 'border-green-200',
    iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    Icon: FaCheckCircle,
  },
  error: {
    border: 'border-red-200',
    iconBg: 'bg-gradient-to-r from-red-500 to-rose-500',
    Icon: FaExclamationCircle,
  },
};

const Toast = ({ message, onClose, duration = 3000, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variant = VARIANTS[type] || VARIANTS.success;
  const Icon = variant.Icon;

  return (
    <div className="fixed top-24 right-6 z-[100] animate-[slideIn_0.3s_ease-out]">
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className={`bg-white rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[300px] border ${variant.border}`}>
        <div className={`w-10 h-10 ${variant.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className="text-white text-xl" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-semibold text-sm">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default Toast;
