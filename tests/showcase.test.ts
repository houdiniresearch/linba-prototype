import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Course, Question } from "../lib/types";
test("example data is scoped, repeatable, coherent and does not overwrite real records", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "linba-showcase-"));
  process.env.LINBA_DATA_DIR = directory;
  const { put, get, all, db } = await import("../lib/db");
  const { createCourse } = await import("../lib/courses");
  const { seedShowcaseRecords } = await import("../lib/showcase");
  const { showcaseDefinitions } = await import("../lib/showcase-content");
  const { confusionSpikes } = await import("../lib/live-insights");
  const now = Date.parse("2026-10-21T10:00:00Z");
  try {
    const real = await createCourse(
      "owner",
      "Existing",
      "real.pdf",
      [
        {
          id: "page",
          number: 1,
          title: "Content",
          text: "Real content",
          image: "page.png",
          ratio: 16 / 9,
        },
      ],
      7,
      true,
      "real",
    );
    const original = structuredClone(real);
    await seedShowcaseRecords(real, now);
    assert.deepEqual(await get("course", "real"), original);
    assert.equal((await all("question")).length, 0);
    for (const definition of showcaseDefinitions) {
      const course: Course = {
        ...original,
        id: definition.key,
        showcase: {
          pack: "bigg-v1",
          key: definition.key,
          theme: definition.theme,
        },
        status: "live",
        startedAt: new Date(now).toISOString(),
        slides: definition.activities.map((item, n) => ({
          id: `activity-${n}`,
          kind: "activity",
          activity: item.activity,
        })),
      };
      await put("course", course);
      const realQuestion: Question = {
        id: `real:${course.id}`,
        courseId: course.id,
        userId: "real-participant",
        userName: "Real participant",
        text: "Keep this record",
        status: "manual",
        groupId: "real",
        groupTitle: "Real",
        sources: [],
        createdAt: new Date(now - 1000).toISOString(),
        stage: "live",
      };
      await put("question", realQuestion);
      await seedShowcaseRecords(course, now);
      const counts = [
        (await all("member")).length,
        (await all("question")).length,
        (await all("response")).length,
      ];
      await seedShowcaseRecords(course, now + 1000);
      assert.deepEqual(
        [
          (await all("member")).length,
          (await all("question")).length,
          (await all("response")).length,
        ],
        counts,
      );
      assert.deepEqual(await get("question", realQuestion.id), realQuestion);
      const questions = (await all<Question>("question")).filter(
        (q) => q.courseId === course.id,
      );
      assert.equal(questions.length, definition.questions.length + 1);
      assert.equal(confusionSpikes(questions, course, now + 1001).length, 1);
      assert.ok(
        questions.every((q) =>
          q.sources.every(
            (source) => source >= 1 && source <= definition.slides.length,
          ),
        ),
      );
      assert.ok(
        definition.activities.every(
          (item) =>
            !item.distribution ||
            item.distribution.reduce((sum, n) => sum + n, 0) <=
              definition.participants,
        ),
      );
      definition.activities.forEach((item, index) => {
        if (item.activity.type !== "poll") {
          const expected = definition.participants - index * 2 - 1;
          assert.ok(
            item.answers.length >= expected,
            "Every sample written response has its own wording",
          );
          assert.equal(new Set(item.answers.slice(0, expected)).size, expected);
        }
      });
      course.status = "ended";
      course.endedAt = new Date(now + 60000).toISOString();
      await seedShowcaseRecords(course, now + 60000);
      assert.equal(
        (await get<Course>("course", course.id))?.report?.source,
        "showcase",
      );
      assert.equal((await get<Course>("course", course.id))?.report?.ai, false);
    }
    assert.deepEqual(await get("course", "real"), original);
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
