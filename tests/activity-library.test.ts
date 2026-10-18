import test from "node:test";
import assert from "node:assert/strict";
import {
  searchActivityLibrary,
  ACTIVITY_LIBRARY,
} from "../lib/activity-library";
import { translate } from "../lib/translations";

const tr = (value: string) => translate(value, "tr");
const en = (value: string) => translate(value, "en");
test("the activity library exposes the three response types supported by the product", () => {
  assert.deepEqual(
    ACTIVITY_LIBRARY.map((item) => item.type),
    ["poll", "open", "scenario"],
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
    ["open", "scenario"],
  );
  assert.deepEqual(
    searchActivityLibrary("case", tr).map((item) => item.type),
    ["scenario"],
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
