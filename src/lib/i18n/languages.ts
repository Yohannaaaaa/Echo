export type LanguageCode = 'fr' | 'en' | 'es' | 'de' | 'it' | 'nl' | 'pt' | 'ru' | 'tr' | 'ja' | 'ko' | 'zh';

export const LANGUAGES: Array<{ code: LanguageCode; flag: string; name: string }> = [
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'fr';

export function isSupportedLanguage(code: string): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

const LOCALE_TAGS: Record<LanguageCode, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  nl: 'nl-NL',
  pt: 'pt-PT',
  ru: 'ru-RU',
  tr: 'tr-TR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
};

export function localeTag(lang: LanguageCode): string {
  return LOCALE_TAGS[lang];
}

export function detectLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  const candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    const code = raw.slice(0, 2).toLowerCase();
    if (isSupportedLanguage(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}
