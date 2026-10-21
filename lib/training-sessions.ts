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

export type TrainingCollection = {
  id: string;
  current: Course;
  sessions: Course[];
};
/** One reusable training entry, with every live, draft and completed session reachable. */
export function trainingCollections(courses: Course[]): TrainingCollection[] {
  const families = new Map<string, Course[]>();
  for (const course of courses) {
    if (course.trashedAt) continue;
    const id = trainingFamily(course);
    families.set(id, [...(families.get(id) || []), course]);
  }
  return [...families.entries()]
    .map(([id, values]) => {
      const sessions = [...values].sort(
        (a, b) =>
          (b.sessionNumber || 1) - (a.sessionNumber || 1) ||
          b.createdAt.localeCompare(a.createdAt) ||
          a.id.localeCompare(b.id),
      );
      const current =
        sessions.find((c) => c.status === "live") ||
        sessions.find((c) => c.status === "draft") ||
        sessions[0];
      return { id, current, sessions };
    })
    .sort(
      (a, b) =>
        b.current.createdAt.localeCompare(a.current.createdAt) ||
        a.id.localeCompare(b.id),
    );
}
