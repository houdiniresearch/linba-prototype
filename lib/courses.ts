import { limitLearningAccessDays } from "./training-access";
import { randomUUID, randomBytes } from "node:crypto";
import { get, all, find, put } from "./db";
import { AppError } from "./auth";
import { canReadReport, canManagePresentation } from "./teams";
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
import { recoverPendingQuestion } from "./ai-state";
export async function courseForOwner(id: string, user: User) {
  const course = await get<Course>("course", id);
  if (!course || !(await canManagePresentation(user, course)))
    throw new AppError("Training not found.", 404);
  return { ...course, accessDays: limitLearningAccessDays(course.accessDays) };
}
export function canChat(course: Course, now = Date.now()) {
  return (
    course.status === "live" ||
    (course.status === "ended" &&
      !!course.endedAt &&
      now <
        Date.parse(course.endedAt) +
          limitLearningAccessDays(course.accessDays) * 86400000)
  );
}
export async function memberOf(courseId: string, userId: string) {
  return !!(await get("member", `${courseId}:${userId}`));
}
export async function questionsOf(id: string, includeConversation = false) {
  return (
    await Promise.all(
      (await find<Question>("question", { courseId: id }))
        .filter((q) => includeConversation || !q.conversationOnly)
        .map(async (q) => {
          const recovered = recoverPendingQuestion(q);
          if (recovered !== q) await put("question", recovered);
          return recovered;
        }),
    )
  ).sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}
export async function responsesOf(id: string) {
  return (await find<ActivityResponse>("response", { courseId: id })).sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}
export async function rehearsalsOf(id: string) {
  return find<Rehearsal>("rehearsal", { courseId: id });
}
export async function createCourse(
  ownerId: string,
  name: string,
  originalName: string,
  pages: Page[],
  accessDays: number,
  autoAnswer: boolean,
  id: string = randomUUID(),
  folderId?: string,
) {
  let code: string;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while ((await all<Course>("course")).some((c) => c.code === code));
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
    accessDays: limitLearningAccessDays(accessDays),
    autoAnswer,
    createdAt: new Date().toISOString(),
    status: "draft",
    displayKey: randomBytes(24).toString("hex"),
    activeSlideId: slides[0].id,
    slideVersion: 0,
    ...(folderId ? { groupId: folderId } : {}),
  };
  return await put("course", course);
}
export function participantQuestion(question: Question): Question {
  return { ...question, groupId: "", groupTitle: "" };
}
export async function stateFor(
  course: Course,
  user: User,
): Promise<CourseState> {
  course = {
    ...course,
    accessDays: limitLearningAccessDays(course.accessDays),
  };
  const owner = await canManagePresentation(user, course);
  if (!owner && !(await memberOf(course.id, user.id)))
    throw new AppError("Join using the training code first.", 403);
  const [participants, creator, questions, responses, rehearsals] =
    await Promise.all([
      owner
        ? find<{ userId: string; name: string }>("member", {
            courseId: course.id,
          })
        : [],
      owner ? get<User>("user", course.ownerId) : undefined,
      questionsOf(course.id, !owner),
      responsesOf(course.id),
      owner ? rehearsalsOf(course.id) : [],
    ]);
  return {
    course: owner
      ? {
          ...course,
          createdBy: creator?.name || "",
        }
      : {
          ...course,
          ownerId: "",
          displayKey: "",
          report: undefined,
          slides: course.slides.map(({ notes: _notes, ...slide }) => slide),
        },
    questions: questions
      .filter((q) => owner || q.userId === user.id)
      .map((q) => (owner ? q : participantQuestion(q))),
    responses: responses.filter((r) => owner || r.userId === user.id),
    participants: owner
      ? participants.map((m) => ({ id: m.userId, name: m.name }))
      : [],
    rehearsals: rehearsals,
    aiReady: aiReady(),
    model: modelName(),
  };
}
/** Reports use the same workspace permissions as their presentation. */
export async function stateForReport(
  course: Course,
  user: User,
): Promise<CourseState> {
  if (!(await canReadReport(user, course)))
    throw new AppError("Report not found.", 404);
  return { ...(await stateFor(course, user)), canManage: true };
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
