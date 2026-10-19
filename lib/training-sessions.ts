import type { Course } from "./types";

export function trainingFamily(course: Course) {
  return course.trainingId || course.id;
}
/** Keep active sessions reachable; show the last completed session when none are active. */
export function visibleTrainingSessions(courses: Course[]) {
  const families = new Map<string, Course[]>();
  for (const course of courses) {
    const key = trainingFamily(course);
    families.set(key, [...(families.get(key) || []), course]);
  }
  return [...families.values()]
    .flatMap((sessions) => {
      const active = sessions.filter((course) => course.status !== "ended");
      return active.length
        ? active
        : [
            sessions.sort(
              (a, b) =>
                (b.sessionNumber || 1) - (a.sessionNumber || 1) ||
                b.createdAt.localeCompare(a.createdAt),
            )[0],
          ];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
