import { randomUUID, randomBytes } from "node:crypto";
import { get, all, put } from "./db";
import { AppError } from "./auth";
import type {
  Course,
  User,
  Page,
  Question,
  ActivityResponse,
  Rehearsal,
  CourseState,
} from "./types";
import { aiReady, modelName } from "./ai";

export function courseForOwner(id: string, user: User) {
  const course = get<Course>("course", id);
  if (!course || course.ownerId !== user.id)
    throw new AppError("Training not found.", 404);
  return course;
}
export function canChat(course: Course, now = Date.now()) {
  return (
    course.status === "live" ||
    (course.status === "ended" &&
      !!course.endedAt &&
      now < Date.parse(course.endedAt) + course.accessDays * 86400000)
  );
}
export function memberOf(courseId: string, userId: string) {
  return !!get("member", `${courseId}:${userId}`);
}
export function questionsOf(id: string) {
  return all<Question>("question")
    .filter((q) => q.courseId === id)
    .reverse();
}
export function responsesOf(id: string) {
  return all<ActivityResponse>("response")
    .filter((q) => q.courseId === id)
    .reverse();
}
export function rehearsalsOf(id: string) {
  return all<Rehearsal>("rehearsal").filter((q) => q.courseId === id);
}
export function createCourse(
  ownerId: string,
  name: string,
  originalName: string,
  pages: Page[],
  accessDays: number,
  autoAnswer: boolean,
  id = randomUUID(),
) {
  let code: string;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (all<Course>("course").some((c) => c.code === code));
  const slides = pages.map((page) => ({
    id: randomUUID(),
    kind: "document" as const,
    pageId: page.id,
  }));
  const course: Course = {
    id,
    ownerId,
    name,
    originalName,
    pages,
    slides,
    code,
    accessDays,
    autoAnswer,
    createdAt: new Date().toISOString(),
    status: "draft",
    displayKey: randomBytes(24).toString("hex"),
    activeSlideId: slides[0].id,
    slideVersion: 0,
  };
  return put("course", course);
}
export function participantQuestion(question: Question): Question {
  return { ...question, groupId: "", groupTitle: "" };
}
export function stateFor(course: Course, user: User): CourseState {
  const owner = course.ownerId === user.id;
  if (!owner && !memberOf(course.id, user.id))
    throw new AppError("Join using the training code first.", 403);
  const participants = all<{
    id: string;
    courseId: string;
    userId: string;
    name: string;
  }>("member").filter((m) => m.courseId === course.id);
  return {
    course: owner
      ? course
      : { ...course, ownerId: "", displayKey: "", report: undefined },
    questions: questionsOf(course.id)
      .filter((q) => owner || q.userId === user.id)
      .map((q) => (owner ? q : participantQuestion(q))),
    responses: responsesOf(course.id).filter(
      (r) => owner || r.userId === user.id,
    ),
    participants: owner
      ? participants.map((m) => ({ id: m.userId, name: m.name }))
      : [],
    rehearsals: owner ? rehearsalsOf(course.id) : [],
    aiReady: aiReady(),
    model: modelName(),
  };
}
export function activeSlide(course: Course) {
  return (
    course.slides.find((s) => s.id === course.activeSlideId) || course.slides[0]
  );
}
export function validateSlideOrder(course: Course, ids: string[]) {
  if (
    ids.length !== course.slides.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !course.slides.some((s) => s.id === id))
  )
    throw new AppError("The slide order could not be verified.");
  const original = course.slides
    .filter((s) => s.kind === "document")
    .map((s) => s.id);
  const updated = ids.filter(
    (id) => course.slides.find((s) => s.id === id)?.kind === "document",
  );
  if (original.join() !== updated.join())
    throw new AppError(
      "Keep the original slide order. You can move activities.",
    );
}
