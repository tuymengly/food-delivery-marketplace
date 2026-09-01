import React from 'react'
import { useTranslation } from 'react-i18next'
import Amok from '../assets/image/Amok_kh.png'
import TypeAnimation from '../TypeAnimation'
import 'animate.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BiTime } from 'react-icons/bi';
import { FaStar } from 'react-icons/fa';
import { MdDeliveryDining } from 'react-icons/md';

const Benner = () => {
  const { t } = useTranslation();
  
  return (
    <div className='w-full md:h-[550px] lg:h-[90vh] bg-gradient-to-br from-orange-400 via-orange-300 to-amber-200 px-6 md:8 lg:px-14 relative overflow-hidden'>
      {/* Animated background circles */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className='w-full flex flex-wrap h-full '>
        {/* detail */}
<div className="w-full md:w-1/2 h-full flex items-center pt-10 md:pt-0 md:pe-10 lg:pe-30">
  <div>
    <TypeAnimation/>
    <p
      className="text-slate-800 animate__animated text-xl animate__bounceIn py-5"
    >
      {t('home.bannerSubtitle')}
    </p>

    {/* buttons */}
    <div className="w-full flex gap-10 md:gap-7 lg:gap-10 pt-3">
      <button
        className="px-5 lg:px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl shadow-orange-300/50 font-bold text-base md:text-xl rounded-full
        hover:scale-110 hover:shadow-2xl hover:shadow-orange-400/50 transition-all duration-300 cursor-pointer
        animate__animated animate__backInLeft relative overflow-hidden group"
      >
        <span className="relative z-10">{t('home.orderNow')}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      <button
        className="px-5 lg:px-8 py-3 bg-white/90 backdrop-blur-sm text-black shadow-xl shadow-orange-200/50 text-base md:text-xl rounded-full border-2 border-orange-400
        hover:scale-110 hover:bg-orange-50 hover:border-orange-600 hover:shadow-2xl hover:shadow-orange-300/50 transition-all duration-300 cursor-pointer
        animate__animated animate__zoomInDown font-semibold"
      >
        {t('home.viewMenu')}
      </button>
    </div>

    {/* rating / delivery info */}
    <div className="grid grid-cols-3 mt-15 gap-6 pt-10 max-w-md mx-auto md:mx-0">
      {/* Rating */}
      <div className="flex flex-col items-center md:items-start bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center space-x-1 text-orange-600 mb-2">
          <FaStar xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="lucide lucide-star w-6 h-6 fill-current drop-shadow">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 
              18.18 21.02 12 17.77 5.82 21.02 7 14.14 
              2 9.27 8.91 8.26 12 2"></polygon>
          </FaStar>
          <span className="font-bold text-3xl text-gray-900">4.9</span>
        </div>
        <span className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{t('home.rating')}</span>
      </div>

      {/* Minutes */}
      <div className="flex flex-col items-center md:items-start bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center space-x-1 text-orange-600 mb-2">
          <BiTime xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="lucide lucide-clock w-6 h-6">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </BiTime>
          <span className="font-bold text-3xl text-gray-900">30</span>
        </div>
        <span className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{t('home.minutes')}</span>
      </div>

      {/* Free Delivery */}
      <div className="flex flex-col items-center md:items-start bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center space-x-1 text-orange-600 mb-2">
          <MdDeliveryDining xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className="lucide lucide-truck w-6 h-6">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
            <path d="M15 18H9"></path>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
            <circle cx="17" cy="18" r="2"></circle>
            <circle cx="7" cy="18" r="2"></circle>
          </MdDeliveryDining>
          <span className="font-bold text-3xl text-gray-900">{t('home.free')}</span>
        </div>
        <span className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{t('home.delivery')}</span>
      </div>
    </div>
  </div>
</div>

        {/* image */}
<div className="relative w-full md:w-1/2 h-full pe-0 py-10 animate__animated animate__bounceIn">
  {/* main image */}
  <img
    className="w-full h-full object-cover hover:scale-105 transition-all duration-700 ease-in-out rounded-3xl shadow-2xl border-4 border-white/50"
    src={Amok}
    alt="Benner_Food"
    style={{boxShadow: '0 25px 50px -12px rgba(251, 146, 60, 0.4)'}}
  />

  {/* top-left badge with glassmorphism */}
  <div className="absolute top-5 left-5 bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-col items-start border border-white/30 animate-pulse hover:scale-105 transition-transform duration-300">
    <div className="flex text-yellow-300 mb-1 drop-shadow-lg">
      <span className="text-lg"><i className="fa-solid fa-star"></i></span>
      <span className="text-lg"><i className="fa-solid fa-star"></i></span>
      <span className="text-lg"><i className="fa-solid fa-star"></i></span>
      <span className="text-lg"><i className="fa-solid fa-star"></i></span>
      <span className="text-lg"><i className="fa-solid fa-star"></i></span>
    </div>
    <span className="font-bold text-sm drop-shadow-md">{t('home.excellentService')}</span>
  </div>

  {/* bottom-right badge with glassmorphism */}
  <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl flex items-center gap-3 px-5 py-4 border border-orange-200 hover:scale-105 transition-transform duration-300">
    <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-full text-white text-2xl shadow-lg">
      <i className="fa-solid fa-user-tie"></i>
    </div>
    <div className="flex flex-col leading-tight">
      <span className="font-bold text-2xl text-transparent bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text">2000+</span>
      <span className="text-sm text-gray-600 font-medium">{t('home.happyCustomers')}</span>
    </div>
  </div>
</div>

        
      </div>
    </div>
    
  )
}

export default Benner