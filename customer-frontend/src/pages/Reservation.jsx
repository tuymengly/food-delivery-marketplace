import React, { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import AOS from "aos";
import "aos/dist/aos.css";

const Reservation = () => {
  const { t } = useTranslation();

  useEffect(() => {
    AOS.init({ duration: 900, easing: "ease-in-out", once: true });
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-16 px-6">
      
      {/* Card */}
      <div 
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-10"
        data-aos="zoom-in"
      >
        <h1 
          className="text-4xl font-bold text-center text-orange-600 mb-6"
          data-aos="fade-down"
        >
          {t('reservation.title')}
        </h1>

        <p 
          className="text-center text-gray-600 mb-10"
          data-aos="fade-up"
        >
          {t('reservation.subtitle')}
        </p>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="flex flex-col" data-aos="fade-right">
            <label className="text-gray-700 mb-2">{t('reservation.fullName')}</label>
            <input type="text" placeholder={t('reservation.enterName')} className="border rounded-lg px-4 py-2"/>
          </div>

          <div className="flex flex-col" data-aos="fade-left">
            <label className="text-gray-700 mb-2">{t('reservation.phoneNumber')}</label>
            <input type="text" placeholder="012 345 678" className="border rounded-lg px-4 py-2"/>
          </div>

          <div className="flex flex-col" data-aos="fade-right">
            <label className="text-gray-700 mb-2">{t('reservation.date')}</label>
            <input type="date" className="border rounded-lg px-4 py-2"/>
          </div>

          <div className="flex flex-col" data-aos="fade-left">
            <label className="text-gray-700 mb-2">{t('reservation.time')}</label>
            <input type="time" className="border rounded-lg px-4 py-2"/>
          </div>

          <div className="flex flex-col" data-aos="fade-right">
            <label className="text-gray-700 mb-2">{t('reservation.guests')}</label>
            <select className="border rounded-lg px-4 py-2">
              <option>{t('reservation.onePerson')}</option>
              <option>{t('reservation.twoPeople')}</option>
              <option>{t('reservation.threePeople')}</option>
              <option>{t('reservation.fourPeople')}</option>
              <option>{t('reservation.fivePlus')}</option>
            </select>
          </div>

          <div className="flex flex-col md:col-span-2" data-aos="fade-up">
            <label className="text-gray-700 mb-2">{t('reservation.message')}</label>
            <textarea rows="4" placeholder={t('reservation.specialRequests')} className="border rounded-lg px-4 py-2"></textarea>
          </div>

          <button
            data-aos="zoom-in"
            className="md:col-span-2 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-transform duration-300 hover:scale-[1.03]"
          >
            {t('reservation.reserveNow')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Reservation;
