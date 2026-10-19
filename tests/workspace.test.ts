import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ALL_TIME, withinLibraryPeriod } from "../lib/library-filters";
import type { Course, User } from "../lib/types";

test("time filters use Istanbul calendar boundaries and reject reversed ranges", () => {
  const now = Date.parse("2026-10-19T10:00:00Z");
  const range = {
    ...ALL_TIME,
    period: "custom" as const,
    from: "2026-10-19",
    to: "2026-10-19",
  };
  assert.equal(withinLibraryPeriod("2026-10-18T21:00:00Z", range, now), true);
  assert.equal(withinLibraryPeriod("2026-10-19T20:59:59Z", range, now), true);
  assert.equal(withinLibraryPeriod("2026-10-19T21:00:00Z", range, now), false);
  assert.equal(
    withinLibraryPeriod(
      "2026-10-18T10:00:00Z",
      { ...ALL_TIME, period: "recent" },
      now,
    ),
    true,
  );
  assert.equal(
    withinLibraryPeriod(
      "2026-10-01T10:00:00Z",
      { ...ALL_TIME, period: "recent" },
      now,
    ),
    false,
  );
  assert.equal(
    withinLibraryPeriod(
      "2026-09-30T22:00:00Z",
      { ...ALL_TIME, period: "month" },
      now,
    ),
    true,
  );
  assert.equal(
    withinLibraryPeriod(
      "2026-10-19T10:00:00Z",
      { ...range, from: "2026-10-20" },
      now,
    ),
    false,
  );
});

test("workspace groups, recoverable trash, notes and account settings preserve ownership", async (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "linba-workspace-"));
  process.env.LINBA_DATA_DIR = directory;
  const { put, get, all, db } = await import("../lib/db");
  const { createCourse, stateFor } = await import("../lib/courses");
  const {
    trainingGroups,
    saveTrainingGroup,
    removeTrainingGroup,
    updateTrainingLibrary,
  } = await import("../lib/workspace-library");
  const { updateProfile, updateAccountPassword, accountSettings } =
    await import("../lib/account-settings");
  const { hashPassword, verifyPassword } = await import("../lib/auth");
  const { reportList } = await import("../lib/report-chat");
  const owner: User = {
    id: "owner",
    name: "Owner",
    email: "owner@linba.test",
    role: "teacher",
  };
  const other: User = { ...owner, id: "other", email: "other@linba.test" };
  const learner: User = { ...owner, id: "learner", role: "participant" };
  const originalPassword = "original-test-password";
  put("user", { ...owner, password: hashPassword(originalPassword) });
  put("user", other);
  const root = createCourse(
    owner.id,
    "Repeated training",
    "source.pdf",
    [
      {
        id: "page",
        image: "page.svg",
        number: 1,
        ratio: 16 / 9,
        title: "Source",
        text: "Source text",
      },
    ],
    7,
    true,
    "root",
  );
  root.status = "ended";
  root.endedAt = new Date().toISOString();
  root.slides[0].notes = "Private instructor reminder";
  put("course", root);
  const second = {
    ...root,
    id: "second",
    trainingId: root.id,
    sessionNumber: 2,
    status: "draft" as const,
  };
  put("course", second);
  put("member", {
    id: "root:learner",
    courseId: root.id,
    userId: learner.id,
    name: learner.name,
  });
  try {
    await t.test(
      "groups validate names, ownership, duplicates and assign all sessions together",
      () => {
        const group = saveTrainingGroup(owner, "Sales");
        const foreign = saveTrainingGroup(other, "Other");
        assert.equal(trainingGroups(owner).length, 1);
        assert.throws(() => saveTrainingGroup(owner, " sales "));
        assert.throws(() => saveTrainingGroup(learner, "Private"));
        assert.throws(() =>
          updateTrainingLibrary(other, root.id, "group", group.id),
        );
        assert.throws(() =>
          updateTrainingLibrary(owner, root.id, "group", foreign.id),
        );
        updateTrainingLibrary(owner, root.id, "group", group.id);
        assert.equal(get<Course>("course", root.id)?.groupId, group.id);
        assert.equal(get<Course>("course", second.id)?.groupId, group.id);
        assert.equal(
          saveTrainingGroup(owner, "Sales team", group.id).name,
          "Sales team",
        );
        removeTrainingGroup(owner, group.id);
        assert.equal(get<Course>("course", root.id)?.groupId, undefined);
        assert.equal(trainingGroups(other).length, 1);
      },
    );
    await t.test(
      "Trash preserves every session and restores the complete family",
      () => {
        const live: Course = {
          ...get<Course>("course", second.id)!,
          status: "live" as const,
        };
        put("course", live);
        assert.throws(() => updateTrainingLibrary(owner, root.id, "trash"));
        live.status = "draft";
        put("course", live);
        const count = all<Course>("course").length;
        updateTrainingLibrary(owner, root.id, "trash");
        assert.ok(get<Course>("course", root.id)?.trashedAt);
        assert.ok(get<Course>("course", second.id)?.trashedAt);
        assert.equal(reportList(owner).length, 0);
        assert.equal(all<Course>("course").length, count);
        updateTrainingLibrary(owner, second.id, "restore");
        assert.equal(get<Course>("course", root.id)?.trashedAt, undefined);
        assert.equal(reportList(owner).length, 1);
      },
    );
    await t.test(
      "instructor notes never enter participant course state",
      () => {
        assert.equal(
          stateFor(root, owner).course.slides[0].notes,
          "Private instructor reminder",
        );
        assert.equal(stateFor(root, learner).course.slides[0].notes, undefined);
        assert.equal(
          get<Course>("course", root.id)?.slides[0].notes,
          "Private instructor reminder",
        );
      },
    );
    await t.test(
      "profile validation and password updates are account scoped",
      () => {
        assert.throws(() =>
          updateProfile(owner, { name: "", email: owner.email }),
        );
        assert.throws(() =>
          updateProfile(owner, { name: "Owner", email: other.email }),
        );
        const updated = updateProfile(owner, {
          name: "Updated owner",
          email: "new@linba.test",
        });
        assert.equal(updated.name, "Updated owner");
        assert.equal(get<User>("user", other.id)?.email, other.email);
        assert.equal(accountSettings(owner).hasPassword, true);
        put("session", { id: "owner-session", userId: owner.id });
        put("session", { id: "other-session", userId: other.id });
        assert.throws(() =>
          updateAccountPassword(owner, {
            currentPassword: "bad",
            newPassword: "new-test-password",
          }),
        );
        assert.ok(get("session", "owner-session"));
        updateAccountPassword(owner, {
          currentPassword: originalPassword,
          newPassword: "new-test-password",
        });
        assert.equal(get("session", "owner-session"), undefined);
        assert.ok(get("session", "other-session"));
        assert.ok(
          verifyPassword(
            "new-test-password",
            get<User & { password: string }>("user", owner.id)!.password,
          ),
        );
        assert.throws(() =>
          updateAccountPassword(
            { ...owner, demo: true },
            {
              currentPassword: "new-test-password",
              newPassword: "other-password",
            },
          ),
        );
      },
    );
  } finally {
    db().close();
    rmSync(directory, { recursive: true, force: true });
  }
});
