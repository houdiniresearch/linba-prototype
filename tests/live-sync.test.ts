import test from "node:test";
import assert from "node:assert/strict";
import { createLiveReader, unsentActivityDrafts } from "../lib/live-sync";
import type { Course, ActivityResponse } from "../lib/types";

test("concurrent refreshes share one read and a later refresh gets fresh state", async () => {
  let calls = 0;
  let resolve!: (n: number) => void;
  const reader = createLiveReader(() => {
    calls++;
    return new Promise<number>((r) => {
      resolve = r;
    });
  });
  const first = reader.read();
  assert.equal(reader.read(), first);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve(1);
  assert.equal(await first, 1);
  const next = reader.read();
  await Promise.resolve();
  resolve(2);
  assert.equal(await next, 2);
  assert.equal(calls, 2);
});

test("cancelled or old reads cannot replace a newer result, including transports that ignore abort", async () => {
  let resolveOld!: (n: number) => void;
  let calls = 0;
  const reader = createLiveReader(async () =>
    ++calls === 1
      ? new Promise<number>((r) => {
          resolveOld = r;
        })
      : 2,
  );
  const old = reader.read();
  await Promise.resolve();
  reader.cancel();
  assert.equal(await reader.read(), 2);
  resolveOld(1);
  assert.equal(await old, undefined);
});

test("a hung connection times out and releases the next retry", async () => {
  let calls = 0;
  const reader = createLiveReader<number>(
    () => (++calls === 1 ? new Promise(() => {}) : Promise.resolve(9)),
    15,
  );
  await assert.rejects(reader.read(), /timed out/);
  assert.equal(await reader.read(), 9);
});

test("failed reads can be retried without retaining the failure", async () => {
  let calls = 0;
  const reader = createLiveReader(async () => {
    if (++calls === 1) throw new Error("unavailable");
    return "restored";
  });
  await assert.rejects(reader.read(), /unavailable/);
  assert.equal(await reader.read(), "restored");
});

test("unsent answers remain linked to their own activity, exclude confirmed submissions, and survive session completion", () => {
  const course = {
    status: "live",
    activeSlideId: "a",
    slides: [
      {
        id: "a",
        kind: "activity",
        activity: { type: "open", question: "Explain", options: [] },
      },
      {
        id: "b",
        kind: "activity",
        activity: { type: "poll", question: "Choose", options: ["One", "Two"] },
      },
      { id: "c", kind: "document" },
    ],
  } as Course;
  const drafts = {
    a: "My reasoning",
    b: "Two",
    c: "Ignored",
    unknown: "Ignored",
  };
  assert.deepEqual(
    unsentActivityDrafts(course, drafts, []).map((s) => [s.id, s.draft]),
    [["b", "Two"]],
  );
  course.activeSlideId = "b";
  assert.deepEqual(
    unsentActivityDrafts(course, drafts, []).map((s) => s.id),
    ["a"],
  );
  assert.equal(drafts.a, "My reasoning");
  const submitted = [{ slideId: "a" }] as ActivityResponse[];
  assert.equal(unsentActivityDrafts(course, drafts, submitted).length, 0);
  course.status = "ended";
  assert.deepEqual(
    unsentActivityDrafts(course, drafts, submitted).map((s) => s.id),
    ["b"],
  );
  assert.equal(unsentActivityDrafts(course, { a: "  " }, []).length, 0);
});
