import React, { createContext, useContext, useState } from 'react';
import { APP_LANGUAGES, TRANSLATIONS } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('shareit_app_language') || 'en-IN';
  });

  const changeLanguage = (langCode) => {
    setLanguageState(langCode);
    localStorage.setItem('shareit_app_language', langCode);
    localStorage.setItem('shareit_voice_lang', langCode);
  };

  const t = (key, fallback = '') => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-IN']?.[key] || fallback || key;
  };

  const currentLang = APP_LANGUAGES.find((l) => l.code === language) || APP_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        currentLang,
        languages: APP_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
