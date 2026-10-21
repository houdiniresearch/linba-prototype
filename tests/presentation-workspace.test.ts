import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Course, User } from "../lib/types";
test("opening a completed presentation resumes one editable workspace and preserves prior reports", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "linba-presentation-workspace-"),
  );
  process.env.LINBA_DATA_DIR = directory;
  const { put, get, all, db } = await import("../lib/db");
  const { createCourse } = await import("../lib/courses");
  const { openPresentationWorkspace } = await import("../lib/repeat-training");
  const { createTeam, createTeamInvite, acceptTeamInvite } =
    await import("../lib/teams");
  const owner: User = {
    id: "owner",
    name: "Selin",
    email: "selin@example.test",
    role: "teacher",
  };
  const colleague: User = {
    id: "member",
    name: "Deniz",
    email: "deniz@example.test",
    role: "teacher",
  };
  await put("user", owner);
  await put("user", colleague);
  try {
    await createTeam(owner, "SUCool");
    const invite = await createTeamInvite(owner, colleague.email);
    await acceptTeamInvite(colleague, invite.path.split("/").at(-1)!);
    await mkdir(path.join(directory, "files", "original"), { recursive: true });
    await writeFile(
      path.join(directory, "files", "original", "page.svg"),
      "original-slide",
    );
    const original = await createCourse(
      owner.id,
      "Reusable presentation",
      "source.pdf",
      [
        {
          id: "page",
          number: 1,
          title: "Slide",
          text: "Evidence",
          image: "page.svg",
          ratio: 1.7,
        },
      ],
      7,
      true,
      "original",
    );
    original.status = "ended";
    original.endedAt = "2026-10-20T12:00:00Z";
    original.startedAt = "2026-10-20T11:00:00Z";
    original.slides[0].notes = "Keep this note";
    original.report = {
      summary: "Original report",
      recommendations: [],
      updatedAt: original.endedAt,
      ai: false,
    };
    await put("course", original);
    await put("question", {
      id: "q",
      courseId: original.id,
      text: "Original question",
    });
    const snapshot = structuredClone(await get<Course>("course", original.id));
    const opened = await Promise.all([
      openPresentationWorkspace(owner, original.id),
      openPresentationWorkspace(colleague, original.id),
      openPresentationWorkspace(owner, original.id),
    ]);
    assert.equal(new Set(opened.map((c) => c.id)).size, 1);
    const working = opened[0];
    assert.equal(working.status, "draft");
    assert.equal(working.ownerId, owner.id);
    assert.equal(working.createdAt, original.createdAt);
    assert.equal(working.slides[0].notes, "Keep this note");
    assert.equal(working.report, undefined);
    assert.notEqual(working.code, original.code);
    assert.notEqual(working.slides[0].id, original.slides[0].id);
    assert.deepEqual(await get<Course>("course", original.id), snapshot);
    assert.equal((await all<Course>("course")).length, 2);
    assert.equal(
      (await all<any>("question")).filter((q) => q.courseId === working.id)
        .length,
      0,
    );
    assert.equal(
      (await openPresentationWorkspace(owner, original.id)).id,
      working.id,
    );
    working.name = "Updated presentation";
    working.slides[0].notes = "Updated note";
    working.status = "live";
    await put("course", working);
    assert.equal(
      (await openPresentationWorkspace(owner, original.id)).id,
      working.id,
    );
    working.status = "ended";
    working.endedAt = "2026-10-21T12:00:00Z";
    await put("course", working);
    const next = await openPresentationWorkspace(owner, original.id);
    assert.equal(next.status, "draft");
    assert.equal(next.name, "Updated presentation");
    assert.equal(next.slides[0].notes, "Updated note");
    assert.equal(next.sessionNumber, 3);
    assert.deepEqual(await get<Course>("course", original.id), snapshot);
    const count = (await all<Course>("course")).length;
    await assert.rejects(
      openPresentationWorkspace({ ...owner, id: "outsider" }, original.id),
    );
    await assert.rejects(
      openPresentationWorkspace({ ...owner, role: "participant" }, original.id),
    );
    await put("course", { ...next, trashedAt: new Date().toISOString() });
    await assert.rejects(openPresentationWorkspace(owner, next.id));
    assert.equal((await all<Course>("course")).length, count);
    assert.equal((await readdir(path.join(directory, "files"))).length, 3);
  } finally {
    db().close();
    await rm(directory, { recursive: true, force: true });
  }
});
