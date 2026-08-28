import React from 'react';
import { useTranslation } from 'react-i18next';
import enFlag from '../assets/en.svg';
import khFlag from '../assets/kh.svg';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'kh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 border-2 border-gray-200 hover:border-orange-500 group overflow-hidden active:scale-95"
      title={i18n.language === 'en' ? 'Switch to Khmer' : 'Switch to English'}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
      <img 
        src={i18n.language === 'en' ? khFlag : enFlag}
        alt={i18n.language === 'en' ? 'English Flag' : 'Khmer Flag'}
        className="w-full h-full object-cover rounded-full transition-all duration-300 group-hover:scale-105 relative z-10"
      />
    </button>
  );
};

export default LanguageSwitcher;
