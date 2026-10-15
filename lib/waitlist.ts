import { AppError } from "./auth";
import { get, put } from "./db";
import { createHash } from "node:crypto";
import { isIntegrationId, type IntegrationId } from "./integrations";

export type WaitlistEntry = {
  id: string;
  email: string;
  locale: "tr" | "en";
  createdAt: string;
  updatedAt: string;
};
export type IntegrationWaitlistEntry = WaitlistEntry & {
  integration: IntegrationId;
};

export function joinIntegrationWaitlist(
  integration: unknown,
  value: unknown,
  locale: unknown,
) {
  if (!isIntegrationId(integration))
    throw new AppError("Geçerli bir entegrasyon seç.");
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw new AppError("Geçerli bir e-posta adresi yaz.");
  const email = value.trim().toLowerCase();
  const id = createHash("sha256")
    .update(`${integration}:${email}`)
    .digest("hex");
  const previous = get<IntegrationWaitlistEntry>("integrationWaitlist", id);
  const now = new Date().toISOString();
  return put("integrationWaitlist", {
    id,
    integration,
    email,
    locale: locale === "en" ? "en" : "tr",
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  } satisfies IntegrationWaitlistEntry);
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
