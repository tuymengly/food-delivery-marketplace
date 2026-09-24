import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './locales/en/translation.json';
import translationKM from './locales/km/translation.json';

const savedLanguage = localStorage.getItem('language');
const initialLanguage = savedLanguage === 'kh' ? 'km' : savedLanguage || 'en';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  km: {
    translation: translationKM
  },
  kh: {
    translation: translationKM
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: initialLanguage, // default language from localStorage or 'en'
    supportedLngs: ['en', 'km', 'kh'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en', // fallback language if translation is missing
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false // disable suspense for easier setup
    }
  });

// Keeps <html lang> in sync with i18next so the ":lang(km)" CSS rule applies
// and Khmer text renders with the "Khmer" font on every page.
const syncDocumentLanguage = (lng) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lng === 'km' || lng === 'kh' ? 'km' : 'en';
  }
};

syncDocumentLanguage(i18n.language || initialLanguage);

// Save language preference to localStorage when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng === 'kh' ? 'km' : lng);
  syncDocumentLanguage(lng);
});

export default i18n;
