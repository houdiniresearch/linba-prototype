import { productTurkish } from "./locales/tr-product";
import { turkish, legacyMessageKeys } from "./locales/tr";
export type Locale = "tr" | "en";
export type TranslationValues = Record<string, string | number>;
export function translate(
  text: string,
  locale: Locale,
  values?: TranslationValues,
) {
  const key = legacyMessageKeys[text] || text;
  const result =
    locale === "tr" ? productTurkish[key] || turkish[key] || text : key;
  return values
    ? result.replace(/\{(\w+)\}/g, (token, key) => String(values[key] ?? token))
    : result;
}
