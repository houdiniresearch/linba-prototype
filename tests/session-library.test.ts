import test from "node:test";
import assert from "node:assert/strict";
import { trainingCollections } from "../lib/training-sessions";
import {
  emptyLibraryContext,
  readLibraryContext,
} from "../lib/library-context";
import { withinLibraryPeriod } from "../lib/library-filters";
import type { Course } from "../lib/types";

function session(
  id: string,
  number: number,
  status: Course["status"],
  trainingId = "training",
): Course {
  return {
    id,
    trainingId,
    sessionNumber: number,
    status,
    createdAt: `2026-10-${String(number + 10).padStart(2, "0")}T08:00:00.000Z`,
  } as Course;
}
test("one training entry retains all sessions and prioritises live controls over newer preparation", () => {
  const input = [
    session("ended", 1, "ended"),
    session("live", 2, "live"),
    session("draft", 3, "draft"),
    session("other", 1, "ended", "other"),
  ];
  const families = trainingCollections(input);
  assert.equal(families.length, 2);
  const family = families.find((c) => c.id === "training")!;
  assert.equal(family.current.id, "live");
  assert.deepEqual(
    family.sessions.map((s) => s.id),
    ["draft", "live", "ended"],
  );
  assert.deepEqual(
    input.map((s) => s.id),
    ["ended", "live", "draft", "other"],
  );
});
test("draft and completed families stay reachable, legacy sessions work, and Trash stays excluded", () => {
  const removed = {
    ...session("trash", 4, "live"),
    trashedAt: "2026-10-19T08:00:00Z",
  };
  const family = trainingCollections([
    session("first", 1, "ended"),
    session("latest", 2, "draft"),
    removed,
  ])[0];
  assert.equal(family.current.id, "latest");
  assert.equal(family.sessions.length, 2);
  assert.equal(
    trainingCollections([session("a", 1, "ended"), session("b", 2, "ended")])[0]
      .current.id,
    "b",
  );
  assert.equal(
    trainingCollections([
      {
        ...session("legacy", 1, "ended"),
        trainingId: undefined,
        sessionNumber: undefined,
      },
    ])[0].id,
    "legacy",
  );
});
test("a date-filtered training can expose its matching earlier session while its full history remains available", () => {
  const input = [session("first", 1, "ended"), session("next", 2, "draft")];
  const matching = input.filter((c) =>
    withinLibraryPeriod(c.createdAt, {
      period: "custom",
      from: "2026-10-11",
      to: "2026-10-11",
    }),
  );
  assert.equal(trainingCollections(matching)[0].current.id, "first");
  assert.equal(trainingCollections(input)[0].sessions.length, 2);
});
test("library context round-trips filters and safely defaults invalid or outdated storage", () => {
  const context = {
    ...emptyLibraryContext(),
    search: "Sales",
    groupFilter: "my-group",
    trainingPeriod: { period: "custom", from: "2026-10-01", to: "2026-10-19" },
    reportPeriod: { period: "recent", from: "", to: "" },
  };
  assert.deepEqual(readLibraryContext(JSON.stringify(context)), context);
  for (const value of [null, "{", "null", "false"])
    assert.deepEqual(readLibraryContext(value), emptyLibraryContext());
  assert.deepEqual(
    readLibraryContext(
      '{"trainingPeriod":{"period":"bad"},"reportPeriod":{"period":"custom","from":false},"search":8}',
    ),
    {
      ...emptyLibraryContext(),
      reportPeriod: { period: "custom", from: "", to: "" },
    },
  );
});
