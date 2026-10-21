import test from "node:test";
import assert from "node:assert/strict";
import {
  searchActivityLibrary,
  ACTIVITY_LIBRARY,
} from "../lib/activity-library";
import { translate } from "../lib/translations";
import { activityDraftChanged } from "../lib/activities";
import type { Activity } from "../lib/types";

const tr = (value: string) => translate(value, "tr");
const en = (value: string) => translate(value, "en");
test("the activity library exposes the three response types supported by the product", () => {
  assert.deepEqual(
    ACTIVITY_LIBRARY.map((item) => item.type),
    ["poll", "true-false", "open"],
  );
  assert.equal(searchActivityLibrary("   ", tr).length, 3);
});
test("search handles Turkish case, accents, English aliases and response format", () => {
  assert.deepEqual(
    searchActivityLibrary("ANKET", tr).map((item) => item.type),
    ["poll"],
  );
  assert.deepEqual(
    searchActivityLibrary("acik uclu", tr).map((item) => item.type),
    ["open"],
  );
  assert.deepEqual(
    searchActivityLibrary("YAZILI", tr).map((item) => item.type),
    ["open"],
  );
  assert.deepEqual(
    searchActivityLibrary("case", tr).map((item) => item.type),
    [],
  );
  assert.deepEqual(
    searchActivityLibrary("single choice", en).map((item) => item.type),
    ["poll"],
  );
  assert.deepEqual(searchActivityLibrary("quiz", en), []);
});
test("every catalog string has a Turkish translation", () => {
  for (const item of ACTIVITY_LIBRARY) {
    for (const value of [
      item.title,
      item.description,
      item.response,
      item.sample,
    ])
      assert.notEqual(tr(value), value);
  }
});

test("activity draft protection compares persisted content and clears after restoring it", () => {
  const initial: Activity = {
    type: "poll",
    question: "Choose a channel",
    options: ["Email", "Search"],
  };
  assert.equal(
    activityDraftChanged(undefined, {
      type: "poll",
      question: "",
      options: ["", ""],
    }),
    false,
  );
  assert.equal(
    activityDraftChanged(initial, {
      ...initial,
      question: "A different question",
    }),
    true,
  );
  assert.equal(
    activityDraftChanged(initial, { ...initial, options: ["Search", "Email"] }),
    true,
  );
  assert.equal(
    activityDraftChanged(initial, { ...initial, type: "open" }),
    true,
  );
  assert.equal(
    activityDraftChanged(initial, { ...initial, aiGenerated: true }),
    true,
  );
  assert.equal(
    activityDraftChanged(initial, {
      ...initial,
      question: " Choose a channel ",
      options: ["Email ", "Search", ""],
    }),
    false,
  );
  const open: Activity = {
    type: "open",
    question: "Explain your choice",
    options: [],
  };
  assert.equal(
    activityDraftChanged(open, { ...open, options: ["Unused poll option"] }),
    false,
  );
  assert.equal(
    activityDraftChanged(initial, { ...initial, options: ["Email", "Search"] }),
    false,
  );
});

test("an empty new activity can be dismissed after browsing formats and empty fields", () => {
  for (const type of ["poll", "true-false", "open", "scenario"] as const) {
    assert.equal(
      activityDraftChanged(undefined, {
        type,
        question: "  ",
        options: ["", " ", ""],
        aiGenerated: false,
      }),
      false,
    );
    assert.equal(
      activityDraftChanged(undefined, {
        type,
        question: "A real question",
        options: [],
      }),
      true,
    );
  }
  assert.equal(
    activityDraftChanged(undefined, {
      type: "poll",
      question: "",
      options: ["Email", ""],
    }),
    true,
  );
  assert.equal(
    activityDraftChanged(
      { type: "poll", question: "Saved", options: ["A", "B"] },
      { type: "open", question: "", options: [] },
    ),
    true,
  );
});
