import { workspaceCourses } from "./teams";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { AppError } from "./auth";
import { all, DATA_DIR, transaction, get, put } from "./db";
import { courseForOwner, createCourse } from "./courses";
import { trainingFamily } from "./training-sessions";
import { usesSupabase } from "./supabase-server";
import { seedShowcaseRecords, isShowcase } from "./showcase";
import type { Course, User } from "./types";
import {
  copyPresentationAsset,
  discardPresentationAssets,
} from "./presentation-storage";
type RepeatRequest = {
  id: string;
  courseId: string;
  sourceId: string;
};
const shared = globalThis as typeof globalThis & {
  trainingRepeatJobs?: Map<
    string,
    {
      sourceId: string;
      promise: Promise<Course>;
    }
  >;
};
const pending = (shared.trainingRepeatJobs ||= new Map<
  string,
  {
    sourceId: string;
    promise: Promise<Course>;
  }
>());
export async function repeatTraining(
  user: User,
  sourceId: string,
  requestId: unknown,
  reuseWorkingCopy = false,
): Promise<Course> {
  if (user.role !== "teacher")
    throw new AppError("This area is unavailable for this account type.", 403);
  const source = await courseForOwner(sourceId, user);
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
  const existing = await get<RepeatRequest>("training-repeat", key);
  if (existing) {
    if (existing.sourceId !== sourceId)
      throw new AppError("Refresh the page and try again.", 409);
    return await courseForOwner(existing.courseId, user);
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
      const copies =
        isShowcase(source) && usesSupabase()
          ? []
          : await Promise.allSettled(
              [...new Set(source.pages.map((page) => page.image))].map(
                (image) => {
                  if (path.basename(image) !== image)
                    throw new AppError(
                      "The training materials could not be copied.",
                    );
                  return copyPresentationAsset(source.id, id, image);
                },
              ),
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
      let course!: Course;
      let redundant = false;
      await transaction(async () => {
        const committed = await get<RepeatRequest>("training-repeat", key);
        const working = reuseWorkingCopy
          ? await workingPresentation(user, source)
          : undefined;
        if (committed) {
          if (committed.sourceId !== sourceId)
            throw new AppError("Refresh the page and try again.", 409);
          course = await courseForOwner(committed.courseId, user);
          redundant = true;
        } else if (working) {
          course = working;
          redundant = true;
        } else {
          const family = trainingFamily(source);
          const sessionNumber =
            Math.max(
              ...(await workspaceCourses(user))
                .filter((course) => trainingFamily(course) === family)
                .map((course) => course.sessionNumber || 1),
            ) + 1;
          course = await createCourse(
            reuseWorkingCopy ? source.ownerId : user.id,
            source.name,
            source.originalName,
            pages,
            source.accessDays,
            source.autoAnswer,
            id,
          );
          Object.assign(course, {
            ...(reuseWorkingCopy ? { createdAt: source.createdAt } : {}),
            trainingId: family,
            groupId: source.groupId,
            sessionNumber,
            slides,
            activeSlideId: slides[0]?.id || "",
            coverPage: source.coverPage,
            ...(source.showcase ? { showcase: source.showcase } : {}),
          });
          await put("course", course);
          if (source.showcase) await seedShowcaseRecords(course);
          await put("training-repeat", {
            id: key,
            sourceId,
            courseId: id,
          } satisfies RepeatRequest);
        }
      });
      if (redundant) await discardPresentationAssets(id);
      return course;
    } catch (error) {
      await discardPresentationAssets(id);
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
async function familyPresentations(user: User, source: Course) {
  return (await workspaceCourses(user))
    .filter(
      (course) =>
        !course.trashedAt && trainingFamily(course) === trainingFamily(source),
    )
    .sort(
      (a, b) =>
        (b.sessionNumber || 1) - (a.sessionNumber || 1) ||
        b.createdAt.localeCompare(a.createdAt),
    );
}
async function workingPresentation(user: User, source: Course) {
  const family = await familyPresentations(user, source);
  return (
    family.find((course) => course.status === "live") ||
    family.find((course) => course.status === "draft")
  );
}
/** Opening a reusable presentation resumes its workspace; completed reports stay immutable. */
export async function openPresentationWorkspace(
  user: User,
  sourceId: string,
): Promise<Course> {
  const source = await courseForOwner(sourceId, user);
  if (source.trashedAt)
    throw new AppError("Restore this training from Trash first.", 409);
  if (source.status !== "ended") return source;
  const working = await workingPresentation(user, source);
  if (working) return await courseForOwner(working.id, user);
  const latest =
    (await familyPresentations(user, source)).find(
      (course) => course.status === "ended",
    ) || source;
  // The transaction in repeatTraining checks again after material copying, so
  // simultaneous opens (including by teammates) produce only one workspace.
  return repeatTraining(user, latest.id, randomUUID(), true);
}
