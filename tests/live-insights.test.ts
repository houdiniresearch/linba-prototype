import test from "node:test";
import assert from "node:assert/strict";
import {
  confusionSpikes,
  currentAssessmentSlide,
  liveActivityResponses,
  CONFUSION_WINDOW_MS,
} from "../lib/live-insights";
import type { Question, Course, ActivityResponse } from "../lib/types";

const now = Date.parse("2026-10-21T10:10:00Z");
const course = { id: "presentation", startedAt: "2026-10-21T10:00:00Z" };
const question = (
  id: string,
  userId: string,
  extra: Partial<Question> = {},
): Question => ({
  id,
  userId,
  userName: userId,
  courseId: course.id,
  text: "How does this work?",
  status: "answered",
  answer: "An explanation",
  groupId: "topic",
  groupTitle: "Customer validation",
  sources: [1],
  createdAt: new Date(now - 30_000).toISOString(),
  stage: "live",
  ...extra,
});

test("a burst requires several questions and multiple participants on the same topic", () => {
  const questions = [
    question("a", "one"),
    question("b", "two"),
    question("c", "one"),
  ];
  assert.equal(confusionSpikes(questions.slice(0, 2), course, now).length, 0);
  assert.equal(
    confusionSpikes(
      questions.map((q) => ({ ...q, userId: "one" })),
      course,
      now,
    ).length,
    0,
  );
  assert.deepEqual(
    confusionSpikes(questions, course, now).map(
      ({ id, count, participants }) => ({ id, count, participants }),
    ),
    [{ id: "topic", count: 3, participants: 2 }],
  );
  assert.equal(
    confusionSpikes([...questions, questions[0]], course, now)[0].count,
    3,
  );
});

test("old, future, follow-up, addressed, manual, ungrouped and foreign questions cannot cause a spike", () => {
  const baseline = [question("a", "one"), question("b", "two")];
  for (const extra of [
    { createdAt: new Date(now - CONFUSION_WINDOW_MS).toISOString() },
    { createdAt: new Date(now + 1).toISOString() },
    { createdAt: "invalid" },
    { stage: "followup" },
    { addressed: true },
    { status: "manual" },
    { groupId: "" },
    { courseId: "other" },
  ] as Partial<Question>[])
    assert.equal(
      confusionSpikes([...baseline, question("c", "three", extra)], course, now)
        .length,
      0,
    );
  assert.equal(
    confusionSpikes(
      [...baseline, question("c", "three")],
      { ...course, startedAt: new Date(now - 10_000).toISOString() },
      now,
    ).length,
    0,
  );
  assert.equal(
    confusionSpikes(
      [...baseline, question("c", "three")],
      course,
      now + CONFUSION_WINDOW_MS,
    ).length,
    0,
  );
});

test("topics stay separate and the strongest burst is shown first", () => {
  const questions = [
    question("a", "one"),
    question("b", "two"),
    question("c", "three"),
    ...["d", "e", "f", "g"].map((id) => question(id, id, { groupId: "other" })),
  ];
  assert.deepEqual(
    confusionSpikes(questions, course, now).map((t) => t.count),
    [4, 3],
  );
});

test("assessment follows the current or preceding activity, never a future activity", () => {
  const slides: Course["slides"] = [
    { id: "intro", kind: "document" },
    {
      id: "poll",
      kind: "activity",
      activity: { type: "poll", question: "Choose", options: ["A", "B"] },
    },
    { id: "next", kind: "document" },
  ];
  assert.equal(
    currentAssessmentSlide({ slides, activeSlideId: "intro" }),
    undefined,
  );
  assert.equal(
    currentAssessmentSlide({ slides, activeSlideId: "poll" })?.id,
    "poll",
  );
  assert.equal(
    currentAssessmentSlide({ slides, activeSlideId: "next" })?.id,
    "poll",
  );
});

test("activity results keep the latest participant submission and exclude other slides and courses", () => {
  const response = (
    id: string,
    extra: Partial<ActivityResponse> = {},
  ): ActivityResponse => ({
    id,
    userId: "one",
    userName: "One",
    courseId: course.id,
    slideId: "poll",
    value: "A",
    createdAt: new Date(now).toISOString(),
    ...extra,
  });
  const result = liveActivityResponses(
    [
      response("old", { createdAt: new Date(now - 1000).toISOString() }),
      response("new", { value: "B" }),
      response("foreign", { courseId: "other", userId: "two" }),
      response("slide", { slideId: "other", userId: "three" }),
    ],
    course.id,
    "poll",
  );
  assert.deepEqual(
    result.map((r) => [r.id, r.value]),
    [["new", "B"]],
  );
});
