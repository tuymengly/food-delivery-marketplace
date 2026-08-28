import React, { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { FaBowlFood, FaMotorcycle, FaStar, FaHeadset } from "react-icons/fa6";
import AOS from "aos";
import "aos/dist/aos.css";

const Service = () => {
  const { t } = useTranslation();

  useEffect(() => {
    AOS.init({ duration: 900, easing: "ease-in-out", once: true });
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-orange-50 to-white py-16 px-6 lg:px-24">
      
      {/* Title */}
      <div className="text-center mb-14" data-aos="fade-down">
        <h2 className="text-4xl font-bold text-orange-600">{t('service.title')}</h2>
        <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto" data-aos="fade-up">
          {t('service.subtitle')}
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
          data-aos="zoom-in">
          <FaBowlFood className="text-orange-600 text-5xl mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">{t('service.freshFoods')}</h3>
          <p className="text-gray-600 text-sm">{t('service.freshFoodsDesc')}</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
          data-aos="zoom-in" data-aos-delay="150">
          <FaMotorcycle className="text-orange-600 text-5xl mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">{t('service.fastDelivery')}</h3>
          <p className="text-gray-600 text-sm">{t('service.fastDeliveryDesc')}</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
          data-aos="zoom-in" data-aos-delay="300">
          <FaStar className="text-orange-600 text-5xl mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">{t('service.topQuality')}</h3>
          <p className="text-gray-600 text-sm">{t('service.topQualityDesc')}</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
          data-aos="zoom-in" data-aos-delay="450">
          <FaHeadset className="text-orange-600 text-5xl mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">{t('service.support')}</h3>
          <p className="text-gray-600 text-sm">{t('service.supportDesc')}</p>
        </div>

      </div>
    </div>
  );
};

export default Service;
