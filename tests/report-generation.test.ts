import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Course, ActivityResponse } from "../lib/types";
test("report preparation exposes pending, coalesces work, preserves records and allows failure recovery without stale overwrites", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "linba-report-jobs-"));
  process.env.LINBA_DATA_DIR = directory;
  const { get, put, all, db } = await import("../lib/db");
  const { createCourse } = await import("../lib/courses");
  const {
    prepareReportGeneration,
    runReportGeneration,
    reportCourse,
    reportNeedsRefresh,
  } = await import("../lib/reports");
  try {
    const course = await createCourse(
      "owner",
      "Report",
      "source.pdf",
      [
        {
          id: "page",
          number: 1,
          title: "Source",
          text: "Source data",
          image: "page.png",
          ratio: 16 / 9,
        },
      ],
      7,
      true,
      "course",
    );
    course.slides.push({
      id: "activity",
      kind: "activity",
      activity: { type: "open", question: "Explain the example", options: [] },
    });
    course.status = "ended";
    course.endedAt = new Date().toISOString();
    await put("course", course);
    assert.equal(await prepareReportGeneration(course.id), undefined);
    assert.equal(
      (await get<Course>("course", course.id))!.report?.status,
      "ready",
    );
    const response: ActivityResponse = {
      id: "answer",
      courseId: course.id,
      slideId: "activity",
      userId: "learner",
      userName: "Learner",
      value: "An actual recorded answer",
      createdAt: new Date().toISOString(),
    };
    await put("response", response);
    const generation = (await prepareReportGeneration(course.id))!;
    assert.ok(generation);
    assert.equal(
      (await get<Course>("course", course.id))!.report?.status,
      "pending",
    );
    assert.equal(
      await prepareReportGeneration(course.id),
      undefined,
      "Polling or repeat clicks must not enqueue another model call",
    );
    let release!: (output: {
      summary: string;
      recommendations: string[];
    }) => void;
    let calls = 0;
    let notifyStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    const generator = async (_instructions: string, input: string) => {
      calls++;
      assert.ok(input.includes(response.value));
      return new Promise<{
        summary: string;
        recommendations: string[];
      }>((resolve) => {
        release = resolve;
        notifyStarted();
      });
    };
    const first = runReportGeneration(course.id, generation, generator);
    const second = runReportGeneration(course.id, generation, generator);
    await started;
    const latest = (await get<Course>("course", course.id))!;
    latest.name = "Renamed while preparing";
    await put("course", latest);
    release({
      summary: "Evidence-backed summary",
      recommendations: ["Review the recorded example"],
    });
    await Promise.all([first, second]);
    assert.equal(calls, 1);
    assert.equal((await get<Course>("course", course.id))!.name, latest.name);
    assert.equal(
      (await get<Course>("course", course.id))!.report?.status,
      "ready",
    );
    assert.equal((await all("response")).length, 1);
    assert.equal(
      await reportNeedsRefresh((await get<Course>("course", course.id))!),
      true,
      "A presentation changed during generation; the next report read must refresh it",
    );
    const failed = (await prepareReportGeneration(course.id))!;
    await runReportGeneration(course.id, failed, async () => {
      throw Error("provider unavailable");
    });
    assert.equal(
      (await get<Course>("course", course.id))!.report?.status,
      "error",
    );
    assert.equal(
      (await get<Course>("course", course.id))!.report?.summary,
      "Evidence-backed summary",
    );
    const old = (await prepareReportGeneration(course.id))!;
    let finishOld!: (result: {
      summary: string;
      recommendations: string[];
    }) => void;
    const obsolete = runReportGeneration(
      course.id,
      old,
      async () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    );
    const stale = (await get<Course>("course", course.id))!;
    stale.report!.generationStartedAt = new Date(
      Date.now() - 91000,
    ).toISOString();
    await put("course", stale);
    assert.equal(
      (await reportCourse(course.id))!.report?.status,
      "error",
      "A restarted worker must not leave a permanent loading state",
    );
    const fresh = (await prepareReportGeneration(course.id))!;
    await runReportGeneration(course.id, fresh, async () => ({
      summary: "Newer completed report",
      recommendations: [],
    }));
    finishOld({ summary: "Obsolete output", recommendations: [] });
    await obsolete;
    assert.equal(
      (await get<Course>("course", course.id))!.report?.summary,
      "Newer completed report",
    );
    assert.deepEqual(await get("response", response.id), response);
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
