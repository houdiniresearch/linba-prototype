import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { all, DATA_DIR, get, put, remove } from "../lib/db";
import type { Course, User } from "../lib/types";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
const ids = new Set<string>();
function client() {
  let cookie = "";
  return async (
    endpoint: string,
    body?: object,
    method = body ? "POST" : "GET",
    status = 200,
  ) => {
    const response = await fetch(`${base}/api/${endpoint}`, {
      method,
      headers: { cookie, Origin: base, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const next = response.headers.get("set-cookie");
    if (next) cookie = next.split(";")[0];
    const result = await response.json();
    assert.equal(
      response.status,
      status,
      `${endpoint}: ${JSON.stringify(result)}`,
    );
    return result;
  };
}
async function main() {
  const teacher = client(),
    other = client(),
    learner = client(),
    anonymous = client();
  const password = randomUUID();
  try {
    for (const [request, role] of [
      [teacher, "teacher"],
      [other, "teacher"],
      [learner, "participant"],
    ] as const) {
      const account = await request("auth", {
        action: "register",
        role,
        name: "Workspace QA",
        email: `workspace-${randomUUID()}@linba.test`,
        password,
      });
      ids.add(account.user.id);
    }
    const { course } = await teacher("courses", {
      demo: true,
      name: "Repeated session QA",
      accessDays: 7,
    });
    await teacher(
      `courses/${course.id}`,
      { action: "rename", name: "Reusable training QA" },
      "PATCH",
    );
    await teacher(
      `courses/${course.id}`,
      {
        action: "notes",
        slideId: course.slides[0].id,
        notes: "Private QA note",
      },
      "PATCH",
    );
    await learner("join", { code: course.code });
    const privateView = await teacher(`courses/${course.id}`);
    assert.equal(privateView.course.slides[0].notes, "Private QA note");
    assert.equal(
      (await learner(`courses/${course.id}`)).course.slides[0].notes,
      undefined,
    );
    const projection = await fetch(
      `${base}/api/presentation/${course.id}?key=${course.displayKey}`,
    ).then((response) => response.json());
    assert.equal(projection.course.slides[0].notes, undefined);
    await other(
      `courses/${course.id}`,
      { action: "notes", slideId: course.slides[0].id, notes: "forbidden" },
      "PATCH",
      403,
    );
    await Promise.all([
      teacher(
        `courses/${course.id}`,
        {
          action: "notes",
          slideId: course.slides[0].id,
          notes: "Private QA note",
        },
        "PATCH",
      ),
      teacher(
        `courses/${course.id}`,
        { action: "select", slideId: course.slides[1].id },
        "PATCH",
      ),
    ]);
    assert.equal(
      (await teacher(`courses/${course.id}`)).course.slides[0].notes,
      "Private QA note",
    );
    const group = (await teacher("groups", { name: "QA Sales" })).group;
    await teacher(`courses/${course.id}/group`, { groupId: group.id });
    await other(`groups/${group.id}`, { name: "Forbidden" }, "PATCH", 404);
    await learner("groups", undefined, "GET", 403);
    const initial = (await get<Course>("course", course.id))!;
    initial.status = "ended";
    initial.startedAt = new Date(Date.now() - 2400000).toISOString();
    initial.endedAt = new Date(Date.now() - 1800000).toISOString();
    await put("course", initial);
    const key = randomUUID();
    const [first, retry] = await Promise.all([
      teacher(`courses/${course.id}/repeat`, { requestId: key }),
      teacher(`courses/${course.id}/repeat`, { requestId: key }),
    ]);
    const repeated: Course = first.course;
    assert.equal(repeated.id, retry.course.id);
    assert.equal(repeated.sessionNumber, 2);
    assert.equal(repeated.trainingId, initial.id);
    assert.equal(repeated.groupId, group.id);
    assert.equal(repeated.name, "Reusable training QA");
    assert.equal(repeated.slides[0].notes, "Private QA note");
    assert.notEqual(repeated.code, initial.code);
    const secondState = await teacher(`courses/${repeated.id}`);
    assert.equal(secondState.participants.length, 0);
    assert.equal(secondState.questions.length, 0);
    await teacher(`courses/${repeated.id}`, { action: "start" }, "PATCH");
    await teacher(`courses/${initial.id}/trash`, {}, "POST", 409);
    const completed = (await get<Course>("course", repeated.id))!;
    completed.status = "ended";
    completed.endedAt = new Date().toISOString();
    await put("course", completed);
    const reports = await teacher("report-assistant");
    assert.equal(reports.reports.length, 2);
    assert.ok(
      reports.reports.every(
        (report: Course) => report.startedAt && report.endedAt,
      ),
    );
    assert.equal(
      (await teacher(`report-assistant/${repeated.id}`)).turns.length,
      0,
    );
    await teacher(`courses/${initial.id}/trash`, {});
    assert.equal((await teacher("report-assistant")).reports.length, 0);
    await learner(`courses/${initial.id}`, undefined, "GET", 410);
    await teacher(`courses/${initial.id}/restore`, {});
    assert.equal((await teacher("report-assistant")).reports.length, 2);
    await teacher(`groups/${group.id}`, undefined, "DELETE");
    assert.equal(
      (await get<Course>("course", repeated.id))?.groupId,
      undefined,
    );
    const profile = await teacher(
      "account",
      { name: "Updated QA", email: `updated-${randomUUID()}@linba.test` },
      "PATCH",
    );
    assert.equal(profile.user.name, "Updated QA");
    assert.equal((await teacher("account")).hasPassword, true);
    await anonymous("account", undefined, "GET", 401);
    await teacher(
      "account",
      { currentPassword: "bad", newPassword: "new-workspace-test-password" },
      "POST",
      400,
    );
    await teacher("account", {
      currentPassword: password,
      newPassword: "new-workspace-test-password",
    });
    assert.equal((await teacher("auth")).user.name, "Updated QA");
    console.log(
      "Workspace HTTP checks passed: private notes, rename, groups, isolated repeated sessions, timestamps, Trash, profile and password rotation.",
    );
  } finally {
    const courses = (await all<Course>("course")).filter((course) =>
      ids.has(course.ownerId),
    );
    const courseIds = new Set(courses.map((course) => course.id));
    for (const kind of [
      "member",
      "question",
      "response",
      "rehearsal",
      "report-turn",
      "training-repeat",
      "training-group",
      "session",
    ]) {
      for (const item of await all<{
        id: string;
        courseId?: string;
        userId?: string;
        ownerId?: string;
        sourceId?: string;
      }>(kind))
        if (
          courseIds.has(item.courseId || "") ||
          courseIds.has(item.sourceId || "") ||
          ids.has(item.userId || "") ||
          ids.has(item.ownerId || "")
        )
          await remove(kind, item.id);
    }
    for (const course of courses) {
      await remove("course", course.id);
      await rm(path.join(DATA_DIR, "files", course.id), {
        recursive: true,
        force: true,
      });
    }
    for (const id of ids) await remove("user", id);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
