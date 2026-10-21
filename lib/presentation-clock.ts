import type { Course } from "./types";

type Clock = Pick<
  Course,
  "startedAt" | "endedAt" | "pausedAt" | "pausedDurationMs"
>;

/** Persisted timestamps keep reloads and other devices in sync. */
export function presentationElapsedMs(clock: Clock, now = Date.now()) {
  const start = Date.parse(clock.startedAt || "");
  const end = clock.endedAt || clock.pausedAt;
  const until = end ? Date.parse(end) : now;
  if (!Number.isFinite(start) || !Number.isFinite(until) || until < start)
    return null;
  const breaks = Number.isFinite(clock.pausedDurationMs)
    ? Math.max(0, clock.pausedDurationMs || 0)
    : 0;
  return Math.max(0, until - start - breaks);
}

/** Repeated requests, including from teammates, don't count breaks twice. */
export function setPresentationPaused(
  course: Course,
  paused: boolean,
  now = Date.now(),
) {
  if (course.status !== "live")
    throw new Error("This presentation is not live.");
  if (paused) {
    if (!course.pausedAt) course.pausedAt = new Date(now).toISOString();
  } else if (course.pausedAt) {
    const since = Date.parse(course.pausedAt);
    course.pausedDurationMs =
      Math.max(0, course.pausedDurationMs || 0) +
      (Number.isFinite(since) ? Math.max(0, now - since) : 0);
    delete course.pausedAt;
  }
}
