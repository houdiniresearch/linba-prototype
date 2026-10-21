import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { visibleTrainingSessions } from "../lib/training-sessions";
import type { Course, User } from "../lib/types";
test("reusable training keeps every session, report and audience independent", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "linba-sessions-"));
  process.env.LINBA_DATA_DIR = directory;
  const { put, get, all, db } = await import("../lib/db");
  const { createCourse, stateFor } = await import("../lib/courses");
  const { repeatTraining } = await import("../lib/repeat-training");
  const { reportList, reportChat } = await import("../lib/report-chat");
  const owner: User = {
    id: "owner",
    name: "Teacher",
    email: "",
    role: "teacher",
  };
  await mkdir(path.join(directory, "files", "first"), { recursive: true });
  await writeFile(
    path.join(directory, "files", "first", "page.svg"),
    "fixture-original-image",
  );
  const first = await createCourse(
    owner.id,
    "Reusable training",
    "source.pdf",
    [
      {
        id: "page",
        number: 1,
        title: "Original page",
        text: "Source material",
        image: "page.svg",
        ratio: 16 / 9,
      },
    ],
    7,
    true,
    "first",
  );
  first.status = "ended";
  first.startedAt = "2026-10-19T06:00:00.000Z";
  first.endedAt = "2026-10-19T07:00:00.000Z";
  first.slides.push({
    id: "activity",
    kind: "activity",
    activity: {
      type: "poll",
      question: "Original question",
      options: ["A", "B"],
    },
  });
  first.report = {
    summary: "Original report",
    recommendations: [],
    updatedAt: first.endedAt,
    ai: false,
  };
  await put("course", first);
  await put("member", {
    id: "first:learner",
    courseId: first.id,
    userId: "learner",
    name: "Learner",
  });
  await put("question", {
    id: "question",
    courseId: first.id,
    userId: "learner",
    text: "Original question",
    createdAt: first.endedAt,
    sources: [],
  });
  await put("response", {
    id: "response",
    courseId: first.id,
    slideId: "activity",
    userId: "learner",
    value: "A",
  });
  await put("report-turn", {
    id: "turn",
    courseId: first.id,
    ownerId: owner.id,
    createdAt: first.endedAt,
    question: "Old conversation",
    answer: "Old answer",
    sources: [],
  });
  await put("rehearsal", {
    id: "practice",
    courseId: first.id,
    audience: "Original practice",
  });
  const before = JSON.stringify(await get("course", first.id));
  let second: Course;
  try {
    await t.test(
      "concurrent retries prepare one session with copied materials and fresh credentials",
      async () => {
        const request = randomUUID();
        const results = await Promise.all([
          repeatTraining(owner, first.id, request),
          repeatTraining(owner, first.id, request),
        ]);
        second = results[0];
        assert.equal(results[0].id, results[1].id);
        assert.equal(
          (await repeatTraining(owner, first.id, request)).id,
          second.id,
        );
        assert.equal(second.trainingId, first.id);
        assert.equal(second.sessionNumber, 2);
        assert.equal(second.status, "draft");
        assert.notEqual(second.code, first.code);
        assert.notEqual(second.displayKey, first.displayKey);
        assert.notEqual(second.pages[0].id, first.pages[0].id);
        assert.notEqual(second.slides[1].id, first.slides[1].id);
        assert.equal(second.slides[0].pageId, second.pages[0].id);
        assert.deepEqual(second.slides[1].activity, first.slides[1].activity);
        assert.equal(
          await readFile(
            path.join(directory, "files", second.id, "page.svg"),
            "utf8",
          ),
          "fixture-original-image",
        );
        assert.equal(second.report, undefined);
        assert.equal(second.startedAt, undefined);
        assert.equal(second.endedAt, undefined);
      },
    );
    await t.test(
      "new audiences and report conversations start empty while earlier records stay intact",
      async () => {
        const fresh = await stateFor(second, owner);
        assert.equal(fresh.questions.length, 0);
        assert.equal(fresh.responses.length, 0);
        assert.equal(fresh.participants.length, 0);
        assert.equal(fresh.rehearsals.length, 0);
        assert.equal((await stateFor(first, owner)).questions.length, 1);
        assert.equal((await reportChat(owner, first.id)).turns.length, 1);
        assert.equal(JSON.stringify(await get("course", first.id)), before);
      },
    );
    await t.test(
      "repeated sessions keep their own timestamps, edits and report history",
      async () => {
        second.slides[1].activity!.question = "New group question";
        second.status = "ended";
        second.startedAt = "2026-10-19T08:00:00.000Z";
        second.endedAt = "2026-10-19T09:00:00.000Z";
        await put("course", second);
        const third = await repeatTraining(owner, second.id, randomUUID());
        assert.equal(third.trainingId, first.id);
        assert.equal(third.sessionNumber, 3);
        assert.equal(third.slides[1].activity?.question, "New group question");
        assert.equal(
          (await get<Course>("course", first.id))?.slides[1].activity?.question,
          "Original question",
        );
        assert.equal((await reportChat(owner, second.id)).turns.length, 0);
        const reports = await reportList(owner);
        assert.equal(reports.length, 2);
        assert.equal(reports[0].id, second.id);
        assert.equal(reports[0].startedAt, "2026-10-19T08:00:00.000Z");
        assert.equal(reports[1].startedAt, "2026-10-19T06:00:00.000Z");
        assert.deepEqual(
          visibleTrainingSessions(await all<Course>("course")).map((c) => c.id),
          [third.id],
        );
      },
    );
    await t.test(
      "ownership, account type, active sessions and malformed retries are rejected",
      async () => {
        await assert.rejects(
          repeatTraining({ ...owner, id: "other" }, first.id, randomUUID()),
        );
        await assert.rejects(
          repeatTraining(
            { ...owner, role: "participant" },
            first.id,
            randomUUID(),
          ),
        );
        await assert.rejects(repeatTraining(owner, first.id, "bad"));
        const draft = (await all<Course>("course")).find(
          (c) => c.status === "draft",
        )!;
        await assert.rejects(repeatTraining(owner, draft.id, randomUUID()));
        const key = randomUUID();
        await repeatTraining(owner, first.id, key);
        await assert.rejects(repeatTraining(owner, second.id, key));
      },
    );
    await t.test(
      "distinct simultaneous sessions receive separate numbers and remain reachable",
      async () => {
        const results = await Promise.all([
          repeatTraining(owner, first.id, randomUUID()),
          repeatTraining(owner, first.id, randomUUID()),
        ]);
        assert.notEqual(results[0].sessionNumber, results[1].sessionNumber);
        assert.notEqual(results[0].code, results[1].code);
        const visible = visibleTrainingSessions(await all<Course>("course"));
        for (const result of results)
          assert.ok(visible.some((c) => c.id === result.id));
      },
    );
    await t.test(
      "a failed material copy leaves no partial session or files",
      async () => {
        const broken = {
          ...first,
          id: "missing",
          pages: [{ ...first.pages[0], image: "missing.svg" }],
        };
        await put("course", broken);
        const count = (await all<Course>("course")).length;
        const folders = await readdir(path.join(directory, "files"));
        await assert.rejects(repeatTraining(owner, broken.id, randomUUID()));
        assert.equal((await all<Course>("course")).length, count);
        assert.deepEqual(await readdir(path.join(directory, "files")), folders);
      },
    );
  } finally {
    db().close();
    await rm(directory, { recursive: true, force: true });
  }
});
