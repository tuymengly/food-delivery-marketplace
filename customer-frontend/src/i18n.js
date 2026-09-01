import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './locales/en/translation.json';
import translationKH from './locales/kh/translation.json';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  kh: {
    translation: translationKH
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // default language from localStorage or 'en'
    fallbackLng: 'en', // fallback language if translation is missing
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false // disable suspense for easier setup
    }
  });

// Save language preference to localStorage when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
