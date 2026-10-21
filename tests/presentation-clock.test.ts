import test from "node:test";
import assert from "node:assert/strict";
import {
  presentationElapsedMs,
  setPresentationPaused,
} from "../lib/presentation-clock";
import { formatTrainingDuration } from "../lib/training-duration";
import type { Course } from "../lib/types";

test("multiple breaks survive reloads, resume from the same time and are excluded from reports", () => {
  const start = Date.parse("2026-10-21T10:00:00Z");
  let course = {
    status: "live",
    startedAt: new Date(start).toISOString(),
  } as Course;
  assert.equal(presentationElapsedMs(course, start + 120_000), 120_000);
  setPresentationPaused(course, true, start + 120_000);
  setPresentationPaused(course, true, start + 180_000);
  course = JSON.parse(JSON.stringify(course)); // reload from persisted state
  assert.equal(presentationElapsedMs(course, start + 900_000), 120_000);
  setPresentationPaused(course, false, start + 900_000);
  setPresentationPaused(course, false, start + 960_000);
  assert.equal(presentationElapsedMs(course, start + 960_000), 180_000);
  setPresentationPaused(course, true, start + 960_000);
  // Finish during a second break, using the same transition as the API.
  setPresentationPaused(course, false, start + 1_560_000);
  course.endedAt = new Date(start + 1_560_000).toISOString();
  course.status = "ended";
  assert.equal(presentationElapsedMs(course, start + 9_000_000), 180_000);
  assert.equal(course.pausedDurationMs, 1_380_000);
  assert.equal(
    formatTrainingDuration(
      course.startedAt,
      course.endedAt,
      "tr",
      course.pausedDurationMs,
    ),
    "3 dakika",
  );
  assert.throws(() => setPresentationPaused(course, true), /not live/);
});

test("old presentations retain their duration; missing or invalid timestamps aren't reported as zero", () => {
  assert.equal(
    presentationElapsedMs({
      startedAt: "2026-10-21T10:00:00Z",
      endedAt: "2026-10-21T10:42:00Z",
    }),
    42 * 60_000,
  );
  assert.equal(presentationElapsedMs({}), null);
  assert.equal(presentationElapsedMs({ startedAt: "invalid" }), null);
  assert.equal(
    presentationElapsedMs({ startedAt: "2026-10-21T10:00:00Z" }, 0),
    null,
  );
});
