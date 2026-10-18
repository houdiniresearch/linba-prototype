import type { Course } from "./types";

export function learningAccess(
  course: Pick<Course, "status" | "endedAt" | "accessDays">,
  now = Date.now(),
) {
  const expiresAt = course.endedAt
    ? Date.parse(course.endedAt) + course.accessDays * 86400000
    : 0;
  const remainingDays = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - now) / 86400000))
    : 0;
  const phase =
    course.status === "live"
      ? "live"
      : course.status === "draft"
        ? "waiting"
        : remainingDays > 0
          ? "followup"
          : "expired";
  return {
    phase,
    remainingDays,
    expiresAt,
    canAsk: phase === "live" || phase === "followup",
  };
}
