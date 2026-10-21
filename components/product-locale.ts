"use client";
import { useMemo } from "react";
import { useLocale } from "./locale-provider";
import { presentationCopy } from "@/lib/presentation-copy";
import type { TranslationValues } from "@/lib/translations";

export function useProductLocale() {
  const base = useLocale();
  return useMemo(
    () => ({
      ...base,
      t: (message: string, values?: TranslationValues) => {
        const copy = presentationCopy(base.t(message));
        return values
          ? copy.replace(/\{(\w+)\}/g, (token, key) =>
              String(values[key] ?? token),
            )
          : copy;
      },
    }),
    [base],
  );
}
