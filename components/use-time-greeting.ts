"use client";
import { useEffect, useState } from "react";
import { timeGreeting } from "@/lib/time-greeting";

export function useTimeGreeting() {
  // A stable first render avoids a server/browser timezone hydration mismatch.
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => {
    const update = () => setGreeting(timeGreeting(new Date().getHours()));
    update();
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return greeting;
}
