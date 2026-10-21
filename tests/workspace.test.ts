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
  await put("user", { ...owner, password: hashPassword(originalPassword) });
  await put("user", other);
  const root = await createCourse(
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
  await put("course", root);
  const second = {
    ...root,
    id: "second",
    trainingId: root.id,
    sessionNumber: 2,
    status: "draft" as const,
  };
  await put("course", second);
  await put("member", {
    id: "root:learner",
    courseId: root.id,
    userId: learner.id,
    name: learner.name,
  });
  try {
    await t.test(
      "groups validate names, ownership, duplicates and assign all sessions together",
      async () => {
        const group = await saveTrainingGroup(owner, "Sales");
        const foreign = await saveTrainingGroup(other, "Other");
        assert.equal((await trainingGroups(owner)).length, 1);
        await assert.rejects(
          async () => await saveTrainingGroup(owner, " sales "),
        );
        await assert.rejects(
          async () => await saveTrainingGroup(learner, "Private"),
        );
        await assert.rejects(
          async () =>
            await updateTrainingLibrary(other, root.id, "group", group.id),
        );
        await assert.rejects(
          async () =>
            await updateTrainingLibrary(owner, root.id, "group", foreign.id),
        );
        await updateTrainingLibrary(owner, root.id, "group", group.id);
        assert.equal((await get<Course>("course", root.id))?.groupId, group.id);
        assert.equal(
          (await get<Course>("course", second.id))?.groupId,
          group.id,
        );
        assert.equal(
          (await saveTrainingGroup(owner, "Sales team", group.id)).name,
          "Sales team",
        );
        await removeTrainingGroup(owner, group.id);
        assert.equal(
          (await get<Course>("course", root.id))?.groupId,
          undefined,
        );
        assert.equal((await trainingGroups(other)).length, 1);
      },
    );
    await t.test(
      "Trash preserves every session and restores the complete family",
      async () => {
        const live: Course = {
          ...(await get<Course>("course", second.id))!,
          status: "live" as const,
        };
        await put("course", live);
        await assert.rejects(
          async () => await updateTrainingLibrary(owner, root.id, "trash"),
        );
        live.status = "draft";
        await put("course", live);
        const count = (await all<Course>("course")).length;
        await updateTrainingLibrary(owner, root.id, "trash");
        assert.ok((await get<Course>("course", root.id))?.trashedAt);
        assert.ok((await get<Course>("course", second.id))?.trashedAt);
        assert.equal((await reportList(owner)).length, 0);
        assert.equal((await all<Course>("course")).length, count);
        await updateTrainingLibrary(owner, second.id, "restore");
        assert.equal(
          (await get<Course>("course", root.id))?.trashedAt,
          undefined,
        );
        assert.equal((await reportList(owner)).length, 1);
      },
    );
    await t.test(
      "instructor notes never enter participant course state",
      async () => {
        assert.equal(
          (await stateFor(root, owner)).course.slides[0].notes,
          "Private instructor reminder",
        );
        assert.equal(
          (await stateFor(root, learner)).course.slides[0].notes,
          undefined,
        );
        assert.equal(
          (await get<Course>("course", root.id))?.slides[0].notes,
          "Private instructor reminder",
        );
      },
    );
    await t.test(
      "profile validation and password updates are account scoped",
      async () => {
        await assert.rejects(
          async () =>
            await updateProfile(owner, { name: "", email: owner.email }),
        );
        await assert.rejects(
          async () =>
            await updateProfile(owner, { name: "Owner", email: other.email }),
        );
        const updated = await updateProfile(owner, {
          name: "Updated owner",
          email: "new@linba.test",
        });
        assert.equal(updated.name, "Updated owner");
        assert.equal((await get<User>("user", other.id))?.email, other.email);
        assert.equal((await accountSettings(owner)).hasPassword, true);
        await put("session", { id: "owner-session", userId: owner.id });
        await put("session", { id: "other-session", userId: other.id });
        await assert.rejects(
          async () =>
            await updateAccountPassword(owner, {
              currentPassword: "bad",
              newPassword: "new-test-password",
            }),
        );
        assert.ok(await get("session", "owner-session"));
        await updateAccountPassword(owner, {
          currentPassword: originalPassword,
          newPassword: "new-test-password",
        });
        assert.equal(await get("session", "owner-session"), undefined);
        assert.ok(await get("session", "other-session"));
        assert.ok(
          verifyPassword(
            "new-test-password",
            (await get<
              User & {
                password: string;
              }
            >("user", owner.id))!.password,
          ),
        );
        await assert.rejects(
          async () =>
            await updateAccountPassword(
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
