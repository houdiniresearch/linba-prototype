import { AppError } from "./auth";
import { get, put } from "./db";
import type { User } from "./types";
export type FeedbackEntry = {
  id: string;
  userId: string;
  category: "idea" | "issue" | "other";
  message: string;
  locale: "en" | "tr";
  createdAt: string;
};
export async function saveFeedback(user: User, body: unknown) {
  if (!body || typeof body !== "object")
    throw new AppError("Enter your feedback.");
  const { message, category, requestId, locale } = body as Record<
    string,
    unknown
  >;
  if (typeof message !== "string" || !message.trim() || message.length > 2000)
    throw new AppError("Write feedback between 1 and 2,000 characters.");
  if (category !== "idea" && category !== "issue" && category !== "other")
    throw new AppError("Choose a feedback type.");
  if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/i.test(requestId))
    throw new AppError("Refresh the page and try again.");
  const id = `${user.id}:${requestId}`;
  const previous = await get<FeedbackEntry>("feedback", id);
  if (previous) return previous;
  return await put("feedback", {
    id,
    userId: user.id,
    category,
    message: message.trim(),
    locale: locale === "en" ? "en" : "tr",
    createdAt: new Date().toISOString(),
  } satisfies FeedbackEntry);
}
