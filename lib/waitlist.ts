import { AppError } from "./auth";
import { get, put } from "./db";
import { createHash } from "node:crypto";

export type WaitlistEntry = {
  id: string;
  email: string;
  locale: "tr" | "en";
  createdAt: string;
  updatedAt: string;
};
export function joinPublicWaitlist(value: unknown, locale: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new AppError("Enter a valid email address.");
  const email = value.trim().toLowerCase();
  const id = createHash("sha256").update(email).digest("hex");
  const previous = get<WaitlistEntry>("publicWaitlist", id);
  const now = new Date().toISOString();
  return put("publicWaitlist", {
    id,
    email,
    locale: locale === "en" ? "en" : "tr",
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  } satisfies WaitlistEntry);
}
export function waitlistEntry(userId: string) {
  return get<WaitlistEntry>("waitlist", userId);
}
export function joinWaitlist(userId: string, value: unknown, locale: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new AppError("Enter a valid email address.");
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
