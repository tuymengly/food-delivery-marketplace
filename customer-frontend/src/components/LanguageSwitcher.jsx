import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GrLanguage } from 'react-icons/gr';

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kh', label: 'Khmer', native: 'ខ្មែរ' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center gap-1.5 h-8 px-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-black-500 group overflow-hidden active:scale-95"
        title="Change language"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
        <GrLanguage
          className="relative z-10 text-gray-700 transition-all duration-300 group-hover:text-black-500"
          aria-hidden="true"
        />
        <span className="relative z-10 text-sm font-medium text-gray-700 group-hover:text-black-500">
          {currentLang.code.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          role="listbox"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              role="option"
              aria-selected={i18n.language === lang.code}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-150 ${
                i18n.language === lang.code
                  ? 'bg-orange-50 text-black-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{lang.native}</span>
              {i18n.language === lang.code && (
                <span className="text-black-500 text-xs">●</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;