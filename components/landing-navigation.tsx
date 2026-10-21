"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type LandingNavigation = {
  navigating: boolean;
  isNavigating: () => boolean;
  subscribeToSettled: (callback: () => void) => () => void;
  navigate: (hash: string) => void;
};
const NavigationContext = createContext<LandingNavigation>({
  navigating: false,
  isNavigating: () => false,
  subscribeToSettled: () => () => {},
  navigate: () => {},
});

export const useLandingNavigation = () => useContext(NavigationContext);

export function LandingNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [navigating, setNavigating] = useState(false);
  const inTransit = useRef(false);
  const listeners = useRef(new Set<() => void>());
  const cancelActive = useRef<(() => void) | null>(null);
  const isNavigating = useCallback(() => inTransit.current, []);
  const subscribeToSettled = useCallback((callback: () => void) => {
    listeners.current.add(callback);
    return () => {
      listeners.current.delete(callback);
    };
  }, []);

  const navigate = useCallback((hash: string) => {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    cancelActive.current?.();
    inTransit.current = true;
    setNavigating(true);
    const scrollMargin = parseFloat(getComputedStyle(target).scrollMarginTop);
    const offset = Number.isFinite(scrollMargin) ? scrollMargin : 88;
    const destination = Math.max(
      0,
      Math.min(
        window.scrollY + target.getBoundingClientRect().top - offset,
        document.documentElement.scrollHeight - window.innerHeight,
      ),
    );
    if (location.hash !== hash) history.pushState(null, "", hash);
    let frame = 0;
    let finished = false;
    const started = performance.now();
    let last = window.scrollY;
    let quietFrames = 0;
    const cleanup = () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", interrupt);
    };
    const finish = (focusTarget: boolean) => {
      if (finished) return;
      finished = true;
      cleanup();
      cancelActive.current = null;
      inTransit.current = false;
      setNavigating(false);
      listeners.current.forEach((listener) => listener());
      if (focusTarget) {
        const heading = target.querySelector<HTMLElement>("h1, h2") || target;
        const previousTabIndex = heading.getAttribute("tabindex");
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
        heading.addEventListener(
          "blur",
          () => {
            if (previousTabIndex === null) heading.removeAttribute("tabindex");
            else heading.setAttribute("tabindex", previousTabIndex);
          },
          { once: true },
        );
      }
    };
    const interrupt = () => {
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
      finish(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        [
          "Escape",
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        interrupt();
    };
    const onScrollEnd = () => {
      if (Math.abs(window.scrollY - destination) <= 2) finish(true);
    };
    const check = () => {
      if (finished) return;
      const current = window.scrollY;
      quietFrames = Math.abs(current - last) < 0.5 ? quietFrames + 1 : 0;
      last = current;
      if (Math.abs(current - destination) <= 2 && quietFrames >= 2) {
        finish(true);
        return;
      }
      // Also handles engines without scrollend and a destination whose layout changed.
      if (performance.now() - started > 4500) {
        window.scrollTo({ top: destination, behavior: "instant" });
        finish(true);
        return;
      }
      frame = requestAnimationFrame(check);
    };
    document.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", interrupt);
    cancelActive.current = () => {
      finished = true;
      cleanup();
    };
    window.scrollTo({
      top: destination,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    frame = requestAnimationFrame(check);
  }, []);

  useEffect(
    () => () => {
      cancelActive.current?.();
      inTransit.current = false;
    },
    [],
  );
  const value = useMemo(
    () => ({ navigating, isNavigating, subscribeToSettled, navigate }),
    [navigating, isNavigating, subscribeToSettled, navigate],
  );
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
