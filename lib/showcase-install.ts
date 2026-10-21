import { asyncMap } from "./async-collections";
import { mkdir, readFile, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { find as findRecords, DATA_DIR, transaction, get, put } from "./db";
import { createCourse } from "./courses";
import {
  showcaseDefinitions,
  type ShowcaseDefinition,
} from "./showcase-content";
import { seedShowcaseRecords } from "./showcase";
import { usesSupabase } from "./supabase-server";
import type { Course, Page, Slide, User } from "./types";
import { discardPresentationAssets } from "./presentation-storage";
export type ShowcaseInstallation = {
  name: string;
  courseId: string;
  reportId: string;
  theme: string;
};
type Installed = {
  id: string;
  presentations: ShowcaseInstallation[];
};
const shared = globalThis as typeof globalThis & {
  showcaseInstallJobs?: Map<string, Promise<ShowcaseInstallation[]>>;
};
const pending = (shared.showcaseInstallJobs ||= new Map<
  string,
  Promise<ShowcaseInstallation[]>
>());
/** Seed once per account, including accounts created before this pack existed.
 * The marker respects later edits, deletions and folders chosen by the user. */
export async function ensureShowcaseWorkspace(
  user: User,
): Promise<ShowcaseInstallation[]> {
  if (user.role !== "teacher")
    throw new Error("A teacher account is required.");
  const key = `bigg-v1:${user.id}`;
  const installed = await get<Installed>("showcase-installation", key);
  if (installed) return installed.presentations;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const job = install(user, key);
  pending.set(key, job);
  try {
    return await job;
  } finally {
    pending.delete(key);
  }
}
async function install(user: User, key: string) {
  const now = Date.now();
  const folderId = `showcase:${user.id}:folder`;
  const directories = new Set<string>();
  const committed = new Set<string>();
  type Prepared = {
    id: string;
    pages: Page[];
    slides: Slide[];
    definition: ShowcaseDefinition;
    ended: boolean;
  };
  const prepared: Prepared[] = [];
  const ownCourses = async () =>
    (await findRecords<Course>("course", { ownerId: user.id })).filter(
      (c) => c.ownerId === user.id && c.showcase?.pack === "bigg-v1",
    );
  const find = (
    courses: Course[],
    definition: ShowcaseDefinition,
    ended: boolean,
  ) =>
    courses.find(
      (c) =>
        c.showcase?.key === definition.key &&
        (c.status === "ended") === ended &&
        !c.trashedAt,
    );
  try {
    const existing = await ownCourses();
    for (const definition of showcaseDefinitions) {
      const materials = path.join(
        process.cwd(),
        "public/showcase/materials",
        definition.key,
      );
      const rawPages: Omit<Page, "id">[] = JSON.parse(
        await readFile(path.join(materials, "pages.json"), "utf8"),
      );
      for (const ended of [true, false]) {
        if (find(existing, definition, ended)) continue;
        const id = randomUUID();
        directories.add(id);
        const directory = path.join(DATA_DIR, "files", id);
        const pages = rawPages.map((page) => ({ ...page, id: randomUUID() }));
        if (!usesSupabase()) {
          await mkdir(directory, { recursive: true });
          for (const page of pages) {
            if (path.basename(page.image) !== page.image)
              throw new Error("Invalid example material.");
            await copyFile(
              path.join(materials, page.image),
              path.join(directory, page.image),
            );
          }
          await copyFile(
            path.join(materials, `${definition.key}-materials.pdf`),
            path.join(directory, "presentation.pdf"),
          );
        } // Public example assets are bundled once, never uploaded per demo account.
        const slides: Slide[] = [];
        pages.forEach((page, index) => {
          slides.push({
            id: randomUUID(),
            kind: "document",
            pageId: page.id,
            notes: definition.slides[index].speaker,
          });
          definition.activities
            .filter((item) => item.afterPage === index + 1)
            .forEach((item) =>
              slides.push({
                id: randomUUID(),
                kind: "activity",
                activity: {
                  ...item.activity,
                  options: [...item.activity.options],
                },
                notes:
                  "Yanıtların gelmesini bekle. Farklı iki yaklaşımı seçip katılımcılardan gerekçelerini paylaşmalarını iste.",
              }),
            );
        });
        prepared.push({ id, pages, slides, definition, ended });
      }
    }
    // Commit the complete example workspace atomically once files are durable.
    let result!: ShowcaseInstallation[];
    const used: string[] = [];
    await transaction(async () => {
      const installed = await get<Installed>("showcase-installation", key);
      if (installed) result = installed.presentations;
      else {
        const courses = await ownCourses();
        if (!(await get("training-group", folderId)))
          await put("training-group", {
            id: folderId,
            userId: user.id,
            name: "Örnek sunumlar",
            createdAt: new Date(now).toISOString(),
          });
        result = await asyncMap(showcaseDefinitions, async (definition) => {
          const familyId =
            courses.find((c) => c.showcase?.key === definition.key)
              ?.trainingId || randomUUID();
          const resolve = async (ended: boolean) => {
            const existing = find(courses, definition, ended);
            if (existing) return existing;
            const data = prepared.find(
              (p) => p.definition.key === definition.key && p.ended === ended,
            );
            if (!data) throw new Error("Example materials are unavailable.");
            const course = await createCourse(
              user.id,
              definition.name,
              `Örnek atölye · ${definition.theme === "dark" ? "Koyu" : "Açık"} tema`,
              data.pages,
              14,
              true,
              data.id,
              folderId,
            );
            const endedAt =
              now - (definition.key === "customer" ? 2 : 1) * 60 * 60000;
            const isLive = !ended && definition.key === "market";
            Object.assign(course, {
              trainingId: familyId,
              sessionNumber: ended ? 1 : 2,
              slides: data.slides,
              coverPage: 1,
              showcase: {
                pack: "bigg-v1",
                key: definition.key,
                theme: definition.theme,
              },
              status: ended ? "ended" : isLive ? "live" : "draft",
              createdAt: new Date(now - 8 * 60 * 60000).toISOString(),
              ...(ended
                ? {
                    startedAt: new Date(
                      endedAt - definition.durationMinutes * 60000,
                    ).toISOString(),
                    endedAt: new Date(endedAt).toISOString(),
                  }
                : isLive
                  ? { startedAt: new Date(now - 18 * 60000).toISOString() }
                  : {}),
              activeSlideId: isLive
                ? data.slides.find((slide) => slide.kind === "activity")!.id
                : data.slides[0].id,
            });
            await put("course", course);
            await seedShowcaseRecords(course, now);
            used.push(course.id);
            return course;
          };
          const report = await resolve(true);
          const working = await resolve(false);
          return {
            name: definition.name,
            courseId: working.id,
            reportId: report.id,
            theme: definition.theme,
          };
        });
        await put("showcase-installation", { id: key, presentations: result });
      }
    });
    used.forEach((id) => committed.add(id));
    return result;
  } finally {
    await Promise.allSettled(
      [...directories]
        .filter((id) => !committed.has(id))
        .map((id) => discardPresentationAssets(id)),
    );
  }
}
