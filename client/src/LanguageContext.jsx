import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { STRINGS, format } from './strings';
import { api } from './api';

/**
 * Holds the active UI strings for the whole app.
 *
 * English is the default and costs nothing. The moment a parent picks Somali or
 * Oromo we send the entire STRINGS object to POST /agent
 * { action: "translate_ui" } exactly once, cache the result in state (an
 * in-memory cache per language, no localStorage), and every screen re-renders
 * in that language because every screen reads its text from t().
 */

const LanguageContext = createContext(null);

export const LANGUAGES = [
  { code: 'so', labelKey: 'language_somali', endonym: 'Af-Soomaali' },
  { code: 'om', labelKey: 'language_oromo', endonym: 'Afaan Oromoo' },
  { code: 'en', labelKey: 'language_english', endonym: 'English' },
];

const LANGUAGE_NAMES = { so: 'Somali', om: 'Oromo', en: 'English' };

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  // { en: STRINGS, so: {...}, om: {...} } — populated as languages are used.
  const [cache, setCache] = useState({ en: STRINGS });
  const [status, setStatus] = useState('ready'); // 'ready' | 'translating' | 'error'
  const [pendingLanguage, setPendingLanguage] = useState(null);
  // In-flight translate_ui requests, keyed by language code, so a prefetch
  // started early is awaited rather than duplicated.
  const inFlight = useRef({});

  const strings = cache[language] || STRINGS;

  /**
   * t('key', { name: 'Amina' }) — falls back to the English string, then to the
   * key itself, so a screen never renders blank.
   */
  const t = useCallback(
    (key, values) => {
      const template = strings[key] ?? STRINGS[key] ?? key;
      return values ? format(template, values) : template;
    },
    [strings]
  );

  /** Starts (or reuses) the translate_ui request for a language. */
  const fetchStrings = useCallback(
    (code) => {
      if (!inFlight.current[code]) {
        inFlight.current[code] = api
          .agent('translate_ui', { stringsObject: STRINGS, targetLanguage: code })
          .then(({ strings: translated }) => {
            setCache((prev) => ({ ...prev, [code]: translated }));
            return translated;
          })
          .catch((err) => {
            // Let the next attempt retry rather than caching the failure.
            delete inFlight.current[code];
            throw err;
          });
      }
      return inFlight.current[code];
    },
    []
  );

  /**
   * Warms a language without switching to it — called as soon as a parent taps
   * a language chip, so the ~1 minute translate_ui call overlaps with them
   * finishing the sign-in form instead of running after it.
   */
  const prefetchLanguage = useCallback(
    (code) => {
      if (!code || code === 'en' || cache[code]) return;
      fetchStrings(code).catch(() => {
        /* changeLanguage surfaces the error when it is actually needed */
      });
    },
    [cache, fetchStrings]
  );

  const changeLanguage = useCallback(
    async (code) => {
      if (code === language && cache[code]) return { ok: true };

      // English needs no round trip.
      if (code === 'en') {
        setLanguage('en');
        setStatus('ready');
        setPendingLanguage(null);
        return { ok: true };
      }

      // Already translated once this session — switch instantly.
      if (cache[code]) {
        setLanguage(code);
        setStatus('ready');
        setPendingLanguage(null);
        return { ok: true };
      }

      setPendingLanguage(code);
      setStatus('translating');

      try {
        // Resolves immediately if a prefetch already finished this language.
        await fetchStrings(code);
        setLanguage(code);
        setStatus('ready');
        setPendingLanguage(null);
        return { ok: true };
      } catch (err) {
        // Stay in English rather than leaving the parent on a broken screen.
        setStatus('error');
        return { ok: false, error: err.message, offline: err.offline };
      }
    },
    [language, cache, fetchStrings]
  );

  const dismissError = useCallback(() => {
    setStatus('ready');
    setPendingLanguage(null);
  }, []);

  const value = useMemo(
    () => ({
      language,
      languageName: LANGUAGE_NAMES[language] || 'English',
      pendingLanguage,
      pendingLanguageName: pendingLanguage ? LANGUAGE_NAMES[pendingLanguage] : null,
      status,
      isTranslating: status === 'translating',
      strings,
      t,
      changeLanguage,
      prefetchLanguage,
      dismissError,
      // True once a non-English UI has been fetched, useful for debugging on stage.
      translatedLanguages: Object.keys(cache).filter((k) => k !== 'en'),
    }),
    [language, pendingLanguage, status, strings, t, changeLanguage, prefetchLanguage, dismissError, cache]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside a LanguageProvider.');
  return ctx;
}

/** Shorthand for screens that only need the translate function. */
export function useT() {
  return useLanguage().t;
}
