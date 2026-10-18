import assert from "node:assert/strict";
import test from "node:test";
import { moveActivityInOrder } from "../lib/slide-order";
import { validateSlideOrder } from "../lib/courses";
import type { Course, Slide } from "../lib/types";

const slides: Slide[] = [
  { id: "page-1", kind: "document", pageId: "one" },
  { id: "activity-a", kind: "activity" },
  { id: "page-2", kind: "document", pageId: "two" },
  { id: "activity-b", kind: "activity" },
  { id: "page-3", kind: "document", pageId: "three" },
];
test("moving an activity places it at the previewed index, including the beginning and end", () => {
  assert.deepEqual(moveActivityInOrder(slides, "activity-a", "page-3"), [
    "page-1",
    "page-2",
    "activity-b",
    "page-3",
    "activity-a",
  ]);
  assert.deepEqual(moveActivityInOrder(slides, "activity-b", "page-1"), [
    "activity-b",
    "page-1",
    "activity-a",
    "page-2",
    "page-3",
  ]);
  assert.deepEqual(moveActivityInOrder(slides, "activity-a", "page-2"), [
    "page-1",
    "page-2",
    "activity-a",
    "activity-b",
    "page-3",
  ]);
});
test("every allowed activity move preserves the original document sequence and passes server validation", () => {
  const original = structuredClone(slides);
  const sourceIds = slides
    .filter((slide) => slide.kind === "document")
    .map((slide) => slide.id);
  for (const activity of slides.filter((slide) => slide.kind === "activity")) {
    for (const target of slides) {
      const ids = moveActivityInOrder(slides, activity.id, target.id)!;
      assert.deepEqual(
        ids.filter((id) => sourceIds.includes(id)),
        sourceIds,
      );
      assert.equal(new Set(ids).size, slides.length);
      assert.equal(ids.indexOf(activity.id), slides.indexOf(target));
      assert.doesNotThrow(() => validateSlideOrder({ slides } as Course, ids));
    }
  }
  assert.deepEqual(slides, original);
});
test("source pages and invalid drag targets never produce a new order", () => {
  assert.equal(moveActivityInOrder(slides, "page-1", "page-3"), null);
  assert.equal(moveActivityInOrder(slides, "activity-a", "outside"), null);
  assert.equal(moveActivityInOrder(slides, "missing", "page-1"), null);
  assert.deepEqual(
    moveActivityInOrder(slides, "activity-a", "activity-a"),
    slides.map((slide) => slide.id),
  );
});
