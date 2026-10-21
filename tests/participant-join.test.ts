import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Course, User } from "../lib/types";
test("nickname participation validates before writing and keeps identities private", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "linba-guest-"));
  process.env.LINBA_DATA_DIR = dir;
  const { all, db, put } = await import("../lib/db");
  const { createCourse, stateFor } = await import("../lib/courses");
  const { joinAsGuest, joinablePresentation, participantNickname } =
    await import("../lib/participant-join");
  const course = await createCourse(
    "instructor",
    "Guest presentation",
    "slides.pdf",
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
    false,
  );
  try {
    await t.test(
      "normalizes readable names and rejects invalid input",
      async () => {
        assert.equal(participantNickname("  Deniz   K.  "), "Deniz K.");
        assert.equal(participantNickname("Deniz 🌊"), "Deniz 🌊");
        for (const value of [
          null,
          12,
          "",
          "a",
          " ",
          "x".repeat(41),
          "<b>",
          "ab\u0000",
          "ab\u200b",
        ]) {
          assert.throws(() => participantNickname(value), /name/);
        }
        for (const code of [
          null,
          123456,
          "12345",
          `${course.code}7`,
          "abcdef",
        ]) {
          await assert.rejects(
            async () => await joinablePresentation(code),
            /6-digit/,
          );
        }
      },
    );
    await t.test(
      "invalid joins never create identities or memberships",
      async () => {
        for (const body of [
          { code: course.code, nickname: "a" },
          { code: "000000", nickname: "Deniz" },
        ]) {
          await assert.rejects(async () => await joinAsGuest(body));
        }
        assert.equal((await all("user")).length, 0);
        assert.equal((await all("member")).length, 0);
      },
    );
    await t.test(
      "same nickname does not let another browser recover an identity",
      async () => {
        const first = await joinAsGuest({
          code: course.code,
          nickname: "Deniz",
        });
        const other = await joinAsGuest({
          code: course.code,
          nickname: "Deniz",
        });
        assert.notEqual(first.user.id, other.user.id);
        assert.deepEqual(Object.keys(first.user).sort(), [
          "email",
          "guest",
          "id",
          "name",
          "role",
        ]);
        assert.equal(first.user.email, "");
        const again = await joinAsGuest(
          { code: course.code, nickname: " Deniz " },
          first.user,
        );
        assert.equal(again.user.id, first.user.id);
        assert.equal((await all("member")).length, 2);
        await put("question", {
          id: "private-question",
          courseId: course.id,
          userId: first.user.id,
          text: "My question",
          status: "manual",
          createdAt: new Date().toISOString(),
        });
        await put("response", {
          id: "private-response",
          courseId: course.id,
          userId: first.user.id,
          value: "My answer",
        });
        assert.equal((await stateFor(course, first.user)).questions.length, 1);
        assert.equal((await stateFor(course, other.user)).questions.length, 0);
        assert.equal((await stateFor(course, other.user)).responses.length, 0);
        assert.equal(
          (await stateFor(course, other.user)).participants.length,
          0,
        );
        assert.equal(
          (await stateFor(course, other.user)).course.displayKey,
          "",
        );
      },
    );
    await t.test(
      "a guest join never reuses a registered or teacher identity",
      async () => {
        for (const role of ["teacher", "participant"] as const) {
          const current: User = {
            id: role,
            role,
            name: "Deniz",
            email: "member@example.test",
          };
          const result = await joinAsGuest(
            { code: course.code, nickname: "Deniz" },
            current,
          );
          assert.notEqual(result.user.id, current.id);
          assert.equal(result.user.guest, true);
          assert.equal(result.user.role, "participant");
        }
      },
    );
    await t.test(
      "respects draft, live, follow-up access and trash",
      async () => {
        for (const status of ["draft", "live", "ended"] as const) {
          const changed: Course = {
            ...course,
            status,
            endedAt: new Date().toISOString(),
          };
          await put("course", changed);
          assert.equal((await joinablePresentation(course.code)).id, course.id);
        }
        await put("course", {
          ...course,
          status: "ended",
          endedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        });
        await assert.rejects(
          async () =>
            await joinAsGuest({ code: course.code, nickname: "Deniz" }),
          /expired/,
        );
        await put("course", { ...course, trashedAt: new Date().toISOString() });
        await assert.rejects(
          async () => await joinablePresentation(course.code),
          /expired/,
        );
      },
    );
  } finally {
    db().close();
    delete (
      globalThis as typeof globalThis & {
        linbaDb?: unknown;
      }
    ).linbaDb;
    rmSync(dir, { recursive: true, force: true });
  }
});
