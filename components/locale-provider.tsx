"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  translate,
  type Locale,
  type TranslationValues,
} from "@/lib/translations";

const LocaleContext = createContext({
  locale: "tr" as Locale,
  setLocale: (_locale: Locale) => {},
  t: (text: string, _values?: TranslationValues) => text,
});

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  const setLocale = useCallback((next: Locale) => {
    const apply = () => {
      document.cookie = `linba_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      document.documentElement.lang = next;
      updateLocale(next);
    };
    if (
      document.querySelector(".landing-page") &&
      document.startViewTransition &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const transition = document.startViewTransition(() => flushSync(apply));
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {});
    } else apply();
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (text: string, values?: TranslationValues) =>
        translate(text, locale, values),
    }),
    [locale, setLocale],
  );
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
