import { AppError } from "./auth";
import { get, put } from "./db";

export type WaitlistEntry = {
  id: string;
  email: string;
  locale: "tr" | "en";
  createdAt: string;
  updatedAt: string;
};
export function waitlistEntry(userId: string) {
  return get<WaitlistEntry>("waitlist", userId);
}
export function joinWaitlist(userId: string, value: unknown, locale: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new AppError("Geçerli bir e-posta adresi yaz.");
  const email = value.trim().toLowerCase();
  const previous = waitlistEntry(userId);
  const now = new Date().toISOString();
  return put("waitlist", {
    id: userId,
    email,
    locale: locale === "en" ? "en" : "tr",
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  } satisfies WaitlistEntry);
}
