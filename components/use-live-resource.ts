"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createLiveReader } from "@/lib/live-sync";

/** Polling scoped to live surfaces; keeps the last confirmed view during failure. */
export function useLiveResource<T>(
  url: string,
  interval = 1600,
  enabled = true,
) {
  const [record, setRecord] = useState<{ url: string; value: T; at: number }>();
  const [failure, setFailure] = useState<{ url: string; message: string }>();
  const [checking, setChecking] = useState(false);
  const current = useRef("");
  current.current = enabled ? url : "";
  const reader = useMemo(
    () =>
      createLiveReader<T>(async (signal) => {
        const response = await fetch(`/api/${url}`, {
          cache: "no-store",
          signal,
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Live updates are unavailable.");
        return result;
      }),
    [url],
  );
  const refresh = useCallback(async () => {
    if (current.current !== url) return;
    if (!navigator.onLine) {
      setFailure({ url, message: "Your device is offline." });
      return;
    }
    setChecking(true);
    try {
      const value = await reader.read();
      if (current.current === url && value !== undefined) {
        setRecord({ url, value, at: Date.now() });
        setFailure(undefined);
      }
      return value;
    } catch (error) {
      if (current.current === url)
        setFailure({
          url,
          message:
            error instanceof TypeError || error instanceof SyntaxError
              ? "Live updates are unavailable."
              : (error as Error).message,
        });
    } finally {
      if (current.current === url) setChecking(false);
    }
  }, [url, reader]);
  const setData = useCallback(
    (value: T | ((previous: T | undefined) => T | undefined)) => {
      if (current.current !== url) return;
      reader.cancel();
      setRecord((previous) => {
        const next =
          typeof value === "function"
            ? (value as (p: T | undefined) => T | undefined)(
                previous?.url === url ? previous.value : undefined,
              )
            : value;
        return next === undefined
          ? undefined
          : { url, value: next, at: Date.now() };
      });
    },
    [reader, url],
  );
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let ticking = false;
    const tick = async () => {
      if (stopped || ticking) return;
      ticking = true;
      clearTimeout(timer);
      if (document.visibilityState !== "hidden") await refresh();
      ticking = false;
      if (!stopped) timer = setTimeout(tick, interval);
    };
    const recover = () => {
      if (document.visibilityState === "visible") void tick();
    };
    const offline = () => {
      reader.cancel();
      setChecking(false);
      setFailure({ url, message: "Your device is offline." });
    };
    window.addEventListener("online", recover);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", recover);
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      reader.cancel();
      window.removeEventListener("online", recover);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", recover);
    };
  }, [enabled, interval, reader, refresh, url]);
  const data = enabled && record?.url === url ? record.value : undefined;
  return {
    data,
    setData,
    refresh,
    checking,
    lastUpdated: data ? record?.at : undefined,
    error: enabled && failure?.url === url ? failure.message : "",
  };
}
