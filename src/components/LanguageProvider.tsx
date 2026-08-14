'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE, detectLanguage, isSupportedLanguage, type LanguageCode } from '@/lib/i18n/languages';
import { TRANSLATIONS, type Translations } from '@/lib/i18n/translations';

const STORAGE_KEY = 'echo_lang';

type Ctx = {
  lang: LanguageCode;
  t: Translations;
  setLang: (lang: LanguageCode) => void;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored && isSupportedLanguage(stored)) {
      setLangState(stored);
    } else {
      setLangState(detectLanguage());
    }
  }, []);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setPickerOpen(false);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        t: TRANSLATIONS[lang],
        setLang,
        pickerOpen,
        openPicker: () => setPickerOpen(true),
        closePicker: () => setPickerOpen(false),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
