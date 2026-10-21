import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Course, User } from "../lib/types";
test("report conversations isolate owners and reports, count real records and recover safely", async (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "linba-report-chat-"));
  process.env.LINBA_DATA_DIR = directory;
  const { put, db } = await import("../lib/db");
  const { reportList, reportChat, sendReportMessage, reportContext } =
    await import("../lib/report-chat");
  const owner: User = {
    id: "teacher-1",
    name: "Teacher",
    email: "",
    role: "teacher",
  };
  const stranger: User = { ...owner, id: "teacher-2" };
  const participant: User = { ...owner, id: "learner", role: "participant" };
  const base: Course = {
    id: "first",
    ownerId: owner.id,
    name: "First",
    originalName: "test",
    createdAt: "2026-10-15T10:00:00Z",
    endedAt: "2026-10-15T11:00:00Z",
    status: "ended",
    accessDays: 7,
    autoAnswer: true,
    code: "123456",
    displayKey: "private",
    pages: [],
    slides: [
      {
        id: "poll",
        kind: "activity",
        activity: { type: "poll", question: "Choose", options: ["A", "B"] },
      },
    ],
    activeSlideId: "poll",
    slideVersion: 0,
  };
  await put("course", base);
  await put("course", { ...base, id: "second", name: "Second" });
  await put("course", {
    ...base,
    id: "foreign",
    ownerId: stranger.id,
    name: "FOREIGN_SECRET",
  });
  await put("course", { ...base, id: "draft", status: "draft" });
  await put("member", {
    id: "member-1",
    courseId: "first",
    userId: "learner",
    name: "Learner",
  });
  for (let i = 0; i < 70; i++)
    await put("question", {
      id: `q-${i}`,
      courseId: "first",
      userId: "learner",
      userName: "Learner",
      text: `${i === 0 ? "Kohort bütçesindeki sıra dışı harcama " : ""}Question ${i} ${"x".repeat(1000)}`,
      answer: "Answer " + "y".repeat(1000),
      status: "answered",
      groupId: "group",
      groupTitle: "Topic",
      sources: [1],
      stage: i < 30 ? "live" : "followup",
      createdAt: new Date(1760000000000 + i).toISOString(),
    });
  await put("question", {
    id: "foreign-q",
    courseId: "foreign",
    text: "FOREIGN_SECRET",
  });
  await put("response", {
    id: "response",
    courseId: "first",
    slideId: "poll",
    userId: "learner",
    userName: "Learner",
    value: "A",
    createdAt: new Date().toISOString(),
  });
  let calls = 0;
  const generate = async (_prompt: string, input: string) => {
    calls++;
    assert(!input.includes("FOREIGN_SECRET"));
    const data = JSON.parse(input);
    return {
      answer: `Report ${data.report.name}`,
      sourceIds: ["counts", "invented", "counts"],
    };
  };
  const message = (
    requestId: string,
    previousTurnId: string | null = null,
  ) => ({ requestId, message: "What happened?", previousTurnId, locale: "en" });
  try {
    await t.test(
      "server enforces instructor ownership and completed status",
      async () => {
        assert.deepEqual((await reportList(owner)).map((r) => r.id).sort(), [
          "first",
          "second",
        ]);
        await assert.rejects(
          async () => await reportChat(stranger, "first"),
          /Report not found/,
        );
        await assert.rejects(
          async () => await reportChat(participant, "first"),
          /account type/,
        );
        await assert.rejects(
          async () => await reportChat(owner, "draft"),
          /when training ends/,
        );
        await assert.rejects(
          sendReportMessage(
            stranger,
            "first",
            message("unauthorized-0001"),
            generate,
          ),
        );
        assert.equal(calls, 0);
      },
    );
    await t.test(
      "full aggregates stay exact when text evidence is bounded",
      async () => {
        const context = await reportContext(base);
        assert.equal(context.counts.questions, 70);
        assert.equal(context.counts.participants, 1);
        assert.equal(context.counts.liveQuestions, 30);
        assert.equal(context.counts.followupQuestions, 40);
        assert.equal(context.counts.activityResponses, 1);
        assert.equal(context.activities[0].distribution?.[0].count, 1);
        assert(context.coverage.questionsIncluded < 70);
        assert.equal(context.coverage.questionsTotal, 70);
        assert.equal(context.questionGroups[0].count, 70);
        const focused = await reportContext(
          base,
          "Kohort bütçesindeki harcama",
        );
        assert(focused.questions.some((question) => question.id === "q-0"));
        assert.equal(focused.counts.questions, 70);
      },
    );
    await t.test(
      "turns persist and idempotent retry does not call model twice",
      async () => {
        const result = await sendReportMessage(
          owner,
          "first",
          message("request-first-0001"),
          generate,
        );
        assert.equal(result.turns.length, 1);
        assert.deepEqual(
          result.turns[0].sources.map((s) => s.id),
          ["counts"],
        );
        assert.equal(
          (await reportChat(owner, "first")).turns[0].answer,
          "Report First",
        );
        const before = calls;
        const retry = await sendReportMessage(
          owner,
          "first",
          message("request-first-0001"),
          generate,
        );
        assert.equal(retry.turns.length, 1);
        assert.equal(calls, before);
        assert.equal((await reportChat(owner, "second")).turns.length, 0);
        await assert.rejects(
          sendReportMessage(
            owner,
            "first",
            { ...message("request-first-0001"), message: "Different" },
            generate,
          ),
          /different message/,
        );
      },
    );
    await t.test(
      "concurrent duplicate requests share one answer and stale histories are rejected",
      async () => {
        const previous = (await reportChat(owner, "first")).turns.at(-1)!.id;
        await assert.rejects(
          sendReportMessage(
            owner,
            "first",
            message("request-stale-001"),
            generate,
          ),
          /another tab/,
        );
        let release!: () => void;
        const waiting = new Promise<void>((ok) => {
          release = ok;
        });
        let count = 0;
        let notifyStarted!: () => void;
        const started = new Promise<void>((resolve) => {
          notifyStarted = resolve;
        });
        const delayed = async () => {
          count++;
          notifyStarted();
          await waiting;
          return { answer: "One answer", sourceIds: ["questions"] };
        };
        const body = message("request-pending-01", previous);
        const first = sendReportMessage(owner, "first", body, delayed);
        await started;
        assert.equal(
          (await reportChat(owner, "first")).pending?.requestId,
          body.requestId,
        );
        const duplicate = sendReportMessage(owner, "first", body, delayed);
        await assert.rejects(
          sendReportMessage(
            owner,
            "first",
            message("request-other-0001", previous),
            generate,
          ),
          /answer is being prepared/,
        );
        await sendReportMessage(
          owner,
          "second",
          message("request-second-01"),
          generate,
        );
        release();
        const [one, two] = await Promise.all([first, duplicate]);
        assert.equal(count, 1);
        assert.equal(one.turns.length, 2);
        assert.equal(two.turns.length, 2);
        assert.equal((await reportChat(owner, "first")).pending, null);
        assert.equal((await reportChat(owner, "second")).turns.length, 1);
      },
    );
    await t.test(
      "provider failures leave no partial turn and same request can be retried",
      async () => {
        const history = (await reportChat(owner, "first")).turns;
        const body = message("request-recovery-1", history.at(-1)!.id);
        await assert.rejects(
          sendReportMessage(owner, "first", body, async () => {
            throw new Error("test failure");
          }),
          /could not respond/,
        );
        assert.equal(
          (await reportChat(owner, "first")).turns.length,
          history.length,
        );
        assert.equal((await reportChat(owner, "first")).pending, null);
        const result = await sendReportMessage(owner, "first", body, generate);
        assert.equal(result.turns.length, history.length + 1);
      },
    );
    await t.test("invalid input never reaches the model", async () => {
      const before = calls;
      await assert.rejects(
        sendReportMessage(
          owner,
          "first",
          { message: "", requestId: "invalid" },
          generate,
        ),
      );
      await assert.rejects(
        sendReportMessage(
          owner,
          "first",
          { message: "x".repeat(3001), requestId: "request-invalid-01" },
          generate,
        ),
      );
      assert.equal(calls, before);
    });
  } finally {
    db().close();
    rmSync(directory, { recursive: true, force: true });
  }
});
