import assert from "node:assert/strict";
import test from "node:test";
import { learningAccess } from "../lib/training-access";
import { learningSignals } from "../lib/learning-insights";
import { translate } from "../lib/translations";
import type { Question } from "../lib/types";

const endedAt = "2026-10-18T12:00:00.000Z";
const now = Date.parse(endedAt);
test("learning agent access distinguishes waiting, live, follow-up and expiry", () => {
  assert.equal(
    learningAccess({ status: "draft", accessDays: 7 }, now).phase,
    "waiting",
  );
  assert.equal(
    learningAccess({ status: "live", accessDays: 0 }, now).canAsk,
    true,
  );
  const ended = { status: "ended" as const, accessDays: 7, endedAt };
  assert.equal(learningAccess(ended, now).phase, "followup");
  assert.equal(learningAccess(ended, now + 6.5 * 86400000).remainingDays, 1);
  assert.equal(learningAccess(ended, now + 7 * 86400000).phase, "expired");
  assert.equal(learningAccess({ ...ended, accessDays: 0 }, now).canAsk, false);
  const legacy = { ...ended, accessDays: 365 };
  assert.equal(learningAccess(legacy, now).remainingDays, 30);
  assert.equal(learningAccess(legacy, now + 30 * 86400000).canAsk, false);
  assert.equal(
    learningAccess({ status: "ended", accessDays: 7 }, now).phase,
    "expired",
  );
});

test("report learning topics require cited answers and do not promote unsupported questions", () => {
  const question: Question = {
    id: "one",
    courseId: "training",
    userId: "learner",
    userName: "Learner",
    text: "Explain cells",
    status: "answered",
    answer: "Cell membranes",
    groupId: "cells",
    groupTitle: "Cell structure",
    sources: [2],
    createdAt: endedAt,
    stage: "live",
  };
  const signals = learningSignals([
    question,
    { ...question, id: "two" },
    {
      ...question,
      id: "unrelated",
      text: "Quantum hardware?",
      groupId: "quantum",
      status: "escalated",
      answer: undefined,
      sources: [],
    },
    { ...question, id: "uncited", groupId: "uncited", sources: [] },
    {
      ...question,
      id: "reviewed",
      status: "manual",
      addressed: true,
      sources: [],
    },
  ]);
  assert.deepEqual(signals.topics, [
    { id: "cells", title: "Cell structure", count: 2 },
  ]);
  assert.deepEqual(
    signals.needsReview.map((q) => q.id),
    ["unrelated"],
  );
});

test("English source strings preserve Turkish UI and historical message compatibility", () => {
  assert.equal(translate("Training not found.", "tr"), "Eğitim bulunamadı.");
  assert.equal(translate("Eğitim bulunamadı.", "en"), "Training not found.");
  assert.equal(translate("Option {number}", "tr", { number: 3 }), "Seçenek 3");
  assert.equal(
    translate("Your own training content", "tr"),
    "Your own training content",
  );
});

test("library folder terminology stays distinct from participant groups in both languages", () => {
  assert.equal(translate("Training folders", "tr"), "Eğitim klasörleri");
  assert.equal(translate("Move to folder", "tr"), "Klasöre taşı");
  assert.equal(translate("No folder", "tr"), "Klasörsüz");
  assert.equal(
    translate("Moved to {folder}.", "tr", { folder: "Satış" }),
    "Satış klasörüne taşındı.",
  );
  assert.equal(
    translate("Moved to {folder}.", "en", { folder: "Sales" }),
    "Moved to Sales.",
  );
  assert.equal(
    translate("Use these materials with another group.", "tr"),
    "Bu içerikle yeni bir gruba eğitim ver.",
  );
});
