import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Course, User } from "../lib/types";
test("new and existing demo workspaces receive both decks, working activities and reports exactly once", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "linba-demo-install-"));
  process.env.LINBA_DATA_DIR = directory;
  const { all, get, put, db } = await import("../lib/db");
  const { ensureShowcaseWorkspace } = await import("../lib/showcase-install");
  const { createCourse } = await import("../lib/courses");
  try {
    const user: User = {
      id: "existing-demo",
      name: "BIGG",
      email: "",
      role: "teacher",
      demo: true,
    };
    await put("user", user);
    const old = await createCourse(
      user.id,
      "Keep my presentation",
      "old.pdf",
      [
        {
          id: "old-page",
          number: 1,
          title: "Old",
          text: "Original",
          image: "old.png",
          ratio: 16 / 9,
        },
      ],
      7,
      true,
    );
    const original = structuredClone(old);
    const results = await Promise.all([
      ensureShowcaseWorkspace(user),
      ensureShowcaseWorkspace(user),
      ensureShowcaseWorkspace(user),
    ]);
    assert.deepEqual(results[0], results[1]);
    assert.deepEqual(results[0], results[2]);
    assert.equal((await all("course")).length, 5);
    assert.deepEqual(await get("course", old.id), original);
    assert.deepEqual(
      results[0].map((p) => p.name),
      ["Müşteriyi Anlamak", "Pazar Analizi"],
    );
    for (const item of results[0]) {
      for (const id of [item.courseId, item.reportId]) {
        const course = (await get<Course>("course", id))!;
        assert.equal(course.pages.length, 8);
        assert.equal(course.slides.length, 11);
        assert.equal(
          course.slides.filter((s) => s.kind === "activity").length,
          3,
        );
        for (const page of course.pages) {
          const png = await readFile(
            path.join(directory, "files", id, page.image),
          );
          assert.equal(png.subarray(1, 4).toString(), "PNG");
          assert.equal(png.readUInt32BE(16), 2400);
        }
        assert.ok(
          (
            await all<{
              courseId: string;
            }>("question")
          ).some((q) => q.courseId === id),
        );
        assert.ok(
          (
            await all<{
              courseId: string;
            }>("response")
          ).some((r) => r.courseId === id),
        );
      }
      assert.equal(
        (await get<Course>("course", item.reportId))!.report?.source,
        "showcase",
      );
    }
    const edited = (await get<Course>("course", results[0][0].courseId))!;
    edited.name = "My renamed deck";
    edited.trashedAt = new Date().toISOString();
    await put("course", edited);
    await ensureShowcaseWorkspace(user);
    assert.deepEqual(await get("course", edited.id), edited);
    assert.equal(
      (await all("course")).length,
      5,
      "Don't resurrect a deleted example on every auth read",
    );
    const newcomer = { ...user, id: "new-demo" };
    await put("user", newcomer);
    const fresh = await ensureShowcaseWorkspace(newcomer);
    assert.equal(fresh.length, 2);
    assert.ok(
      fresh.every(
        (p) => !results[0].some((old) => old.courseId === p.courseId),
      ),
    );
    assert.equal(
      (await all<Course>("course")).filter((c) => c.ownerId === newcomer.id)
        .length,
      4,
    );
  } finally {
    db().close();
    delete (
      globalThis as {
        linbaDb?: unknown;
      }
    ).linbaDb;
    await rm(directory, { recursive: true, force: true });
  }
});
