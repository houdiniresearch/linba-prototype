"use client";
import { useEffect, useState, type SetStateAction } from "react";
import {
  emptyLibraryContext,
  readLibraryContext,
  type LibraryContext,
} from "@/lib/library-context";

/** Session-only, account-scoped view preferences. No course data or credentials. */
export function useLibraryContext(accountId?: string) {
  const [record, setRecord] = useState<{
    accountId?: string;
    value: LibraryContext;
  }>({ value: emptyLibraryContext() });
  useEffect(() => {
    if (!accountId) return;
    let value = emptyLibraryContext();
    try {
      value = readLibraryContext(
        sessionStorage.getItem(`linba:library:${accountId}`),
      );
    } catch {}
    setRecord({ accountId, value });
  }, [accountId]);
  useEffect(() => {
    if (!accountId || record.accountId !== accountId) return;
    try {
      sessionStorage.setItem(
        `linba:library:${accountId}`,
        JSON.stringify(record.value),
      );
    } catch {}
  }, [record, accountId]);
  const context =
    record.accountId === accountId ? record.value : emptyLibraryContext();
  function update<K extends keyof LibraryContext>(
    key: K,
    value: SetStateAction<LibraryContext[K]>,
  ) {
    setRecord((previous) => {
      const current =
        previous.accountId === accountId
          ? previous.value
          : emptyLibraryContext();
      return {
        accountId,
        value: {
          ...current,
          [key]:
            typeof value === "function"
              ? (value as (old: LibraryContext[K]) => LibraryContext[K])(
                  current[key],
                )
              : value,
        },
      };
    });
  }
  return {
    ...context,
    setSearch: (v: SetStateAction<string>) => update("search", v),
    setGroupFilter: (v: SetStateAction<string>) => update("groupFilter", v),
    setTrainingPeriod: (v: SetStateAction<LibraryContext["trainingPeriod"]>) =>
      update("trainingPeriod", v),
    setReportPeriod: (v: SetStateAction<LibraryContext["reportPeriod"]>) =>
      update("reportPeriod", v),
  };
}
