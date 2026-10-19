import { randomUUID } from "node:crypto";
import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { AppError } from "./auth";
import { all, DATA_DIR, db, get, put } from "./db";
import { courseForOwner, createCourse } from "./courses";
import { trainingFamily } from "./training-sessions";
import type { Course, User } from "./types";

type RepeatRequest = { id: string; courseId: string; sourceId: string };
const shared = globalThis as typeof globalThis & {
  trainingRepeatJobs?: Map<
    string,
    { sourceId: string; promise: Promise<Course> }
  >;
};
const pending = (shared.trainingRepeatJobs ||= new Map<
  string,
  { sourceId: string; promise: Promise<Course> }
>());
export async function repeatTraining(
  user: User,
  sourceId: string,
  requestId: unknown,
): Promise<Course> {
  if (user.role !== "teacher")
    throw new AppError("This area is unavailable for this account type.", 403);
  const source = courseForOwner(sourceId, user);
  if (source.trashedAt)
    throw new AppError("Restore this training from Trash first.", 409);
  if (source.status !== "ended")
    throw new AppError(
      "Finish this session before using the training again.",
      409,
    );
  if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/i.test(requestId))
    throw new AppError("Refresh the page and try again.");
  const key = `${user.id}:${requestId}`;
  const existing = get<RepeatRequest>("training-repeat", key);
  if (existing) {
    if (existing.sourceId !== sourceId)
      throw new AppError("Refresh the page and try again.", 409);
    return courseForOwner(existing.courseId, user);
  }
  const inFlight = pending.get(key);
  if (inFlight) {
    if (inFlight.sourceId !== sourceId)
      throw new AppError("Refresh the page and try again.", 409);
    return inFlight.promise;
  }
  const run = async () => {
    const id = randomUUID();
    const directory = path.join(DATA_DIR, "files", id);
    try {
      await mkdir(directory, { recursive: true });
      const copies = await Promise.allSettled(
        [...new Set(source.pages.map((page) => page.image))].map((image) => {
          if (path.basename(image) !== image)
            throw new AppError("The training materials could not be copied.");
          return copyFile(
            path.join(DATA_DIR, "files", source.id, image),
            path.join(directory, image),
          );
        }),
      );
      const failed = copies.find((copy) => copy.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
      const pages = source.pages.map((page) => ({ ...page, id: randomUUID() }));
      const pageIds = new Map(
        source.pages.map((page, index) => [page.id, pages[index].id]),
      );
      const slides = source.slides.map((slide) => ({
        ...slide,
        id: randomUUID(),
        ...(slide.pageId ? { pageId: pageIds.get(slide.pageId) } : {}),
        ...(slide.activity
          ? {
              activity: {
                ...slide.activity,
                options: [...slide.activity.options],
              },
            }
          : {}),
      }));
      db().exec("BEGIN IMMEDIATE");
      let course: Course;
      let redundant = false;
      try {
        const committed = get<RepeatRequest>("training-repeat", key);
        if (committed) {
          if (committed.sourceId !== sourceId)
            throw new AppError("Refresh the page and try again.", 409);
          course = courseForOwner(committed.courseId, user);
          redundant = true;
        } else {
          const family = trainingFamily(source);
          const sessionNumber =
            Math.max(
              ...all<Course>("course")
                .filter(
                  (course) =>
                    course.ownerId === user.id &&
                    trainingFamily(course) === family,
                )
                .map((course) => course.sessionNumber || 1),
            ) + 1;
          course = createCourse(
            user.id,
            source.name,
            source.originalName,
            pages,
            source.accessDays,
            source.autoAnswer,
            id,
          );
          Object.assign(course, {
            trainingId: family,
            groupId: source.groupId,
            sessionNumber,
            slides,
            activeSlideId: slides[0]?.id || "",
            coverPage: source.coverPage,
          });
          put("course", course);
          put("training-repeat", {
            id: key,
            sourceId,
            courseId: id,
          } satisfies RepeatRequest);
        }
        db().exec("COMMIT");
      } catch (error) {
        db().exec("ROLLBACK");
        throw error;
      }
      if (redundant) await rm(directory, { recursive: true, force: true });
      return course;
    } catch (error) {
      await rm(directory, { recursive: true, force: true });
      if (error instanceof AppError) throw error;
      throw new AppError(
        "The training materials could not be copied. Try again.",
        500,
      );
    }
  };
  const job = run();
  pending.set(key, { sourceId, promise: job });
  try {
    return await job;
  } finally {
    pending.delete(key);
  }
}
