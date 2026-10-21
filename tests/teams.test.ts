import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { User } from "../lib/types";
test("team members collaborate across the workspace; unrelated accounts stay isolated", async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "linba-team-workspace-"));
  process.env.LINBA_DATA_DIR = dir;
  const { all, db, put } = await import("../lib/db");
  const team = await import("../lib/teams");
  const { createCourse, courseForOwner, stateFor, stateForReport } =
    await import("../lib/courses");
  const folders = await import("../lib/workspace-library");
  const { reportList, reportChat, sendReportMessage } =
    await import("../lib/report-chat");
  const owner: User = {
    id: "selin",
    name: "Selin",
    email: "selin@example.test",
    role: "teacher",
  };
  const colleague: User = {
    id: "coordinator",
    name: "Deniz",
    email: "deniz@example.test",
    role: "teacher",
  };
  const outsider: User = {
    id: "outside",
    name: "Other",
    email: "other@example.test",
    role: "teacher",
  };
  const learner: User = {
    id: "learner",
    name: "Learner",
    email: "learner@example.test",
    role: "participant",
  };
  for (const u of [owner, colleague, outsider, learner]) await put("user", u);
  try {
    await team.createTeam(owner, " SUCool ");
    const course = await createCourse(
      owner.id,
      "Shared presentation",
      "slides.pdf",
      [
        {
          id: "p",
          number: 1,
          title: "Slide",
          text: "Evidence",
          image: "p.svg",
          ratio: 1.7,
        },
      ],
      0,
      true,
    );
    course.status = "ended";
    course.endedAt = "2026-10-20T10:00:00Z";
    course.slides = [
      { id: "slide", kind: "document", notes: "Instructor note" },
    ];
    await put("course", course);
    await put("rehearsal", {
      id: "rehearsal",
      courseId: course.id,
      remarks: ["Practice record"],
    });
    const draft = await createCourse(
      owner.id,
      "Draft",
      "slides.pdf",
      [
        {
          id: "p",
          number: 1,
          title: "Slide",
          text: "Evidence",
          image: "p.svg",
          ratio: 1.7,
        },
      ],
      7,
      true,
    );
    await t.test(
      "invites are email-bound, hashed, revocable and idempotent",
      async () => {
        await assert.rejects(async () => await team.createTeam(owner, "Other"));
        await assert.rejects(
          async () => await team.createTeam(learner, "Other"),
        );
        const old = await team.createTeamInvite(owner, colleague.email),
          renewed = await team.createTeamInvite(owner, colleague.email);
        await assert.rejects(
          async () => await team.inspectTeamInvite(old.path.split("/").at(-1)!),
        );
        const token = renewed.path.split("/").at(-1)!;
        assert.ok(!JSON.stringify(await all("team-invite")).includes(token));
        await assert.rejects(
          async () => await team.acceptTeamInvite(outsider, token),
        );
        await assert.rejects(
          async () => await courseForOwner(course.id, colleague),
        );
        await team.acceptTeamInvite(colleague, token);
        await team.acceptTeamInvite(colleague, token);
        assert.equal((await team.teamState(owner)).members.length, 2);
      },
    );
    await t.test(
      "members access drafts, completed presentations, notes, practice and reports",
      async () => {
        assert.equal((await courseForOwner(draft.id, colleague)).id, draft.id);
        assert.equal(
          (await courseForOwner(course.id, colleague)).id,
          course.id,
        );
        const state = await stateFor(course, colleague);
        assert.equal(state.course.displayKey, course.displayKey);
        assert.equal(state.course.slides[0].notes, "Instructor note");
        assert.equal(state.rehearsals.length, 1);
        assert.equal(state.course.createdBy, "Selin");
        assert.equal((await stateForReport(course, colleague)).canManage, true);
        assert.equal((await reportList(colleague)).length, 1);
        assert.equal((await team.teamState(colleague)).reports.length, 1);
        await assert.rejects(
          async () => await courseForOwner(course.id, outsider),
        );
        await assert.rejects(async () => await stateFor(course, learner));
      },
    );
    await t.test(
      "folders are shared, editable and retain their actual creator",
      async () => {
        const group = await folders.saveTrainingGroup(owner, "Sales");
        assert.equal((await folders.trainingGroups(colleague))[0].id, group.id);
        await folders.saveTrainingGroup(colleague, "Sales team", group.id);
        assert.equal((await folders.trainingGroups(owner))[0].userId, owner.id);
        await folders.updateTrainingLibrary(
          colleague,
          draft.id,
          "group",
          group.id,
        );
        await assert.rejects(
          async () =>
            await folders.updateTrainingLibrary(outsider, draft.id, "trash"),
        );
        await folders.updateTrainingLibrary(colleague, draft.id, "trash");
        await folders.updateTrainingLibrary(owner, draft.id, "restore");
        await folders.removeTrainingGroup(colleague, group.id);
        assert.equal((await folders.trainingGroups(owner)).length, 0);
      },
    );
    await t.test(
      "AI conversations and pending jobs are separate for each member",
      async () => {
        const request = {
          message: "Summarize this presentation",
          requestId: "shared-request-id-123456",
          previousTurnId: null,
        };
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        const pending = sendReportMessage(
          owner,
          course.id,
          request,
          async () => {
            await gate;
            return { answer: "Owner answer", sourceIds: ["counts"] };
          },
        );
        assert.equal((await reportChat(colleague, course.id)).pending, null);
        await sendReportMessage(colleague, course.id, request, async () => ({
          answer: "Member answer",
          sourceIds: ["counts"],
        }));
        release();
        await pending;
        assert.equal(
          (await reportChat(owner, course.id)).turns[0].answer,
          "Owner answer",
        );
        assert.equal(
          (await reportChat(colleague, course.id)).turns[0].answer,
          "Member answer",
        );
      },
    );
    await t.test(
      "removal cuts off every workspace capability and revokes accepted invitations",
      async () => {
        const invite = (
          await all<import("../lib/teams").TeamInvite>("team-invite")
        ).find((i) => i.acceptedBy === colleague.id)!;
        await assert.rejects(
          async () => await team.renameTeam(colleague, "Changed"),
        );
        await team.removeTeamMember(owner, colleague.id);
        await assert.rejects(
          async () => await courseForOwner(draft.id, colleague),
        );
        await assert.rejects(async () => await stateFor(course, colleague));
        assert.equal((await reportList(colleague)).length, 0);
        assert.equal(await team.canManagePresentation(outsider, course), false);
        assert.equal(
          (await all<import("../lib/teams").TeamInvite>("team-invite")).find(
            (i) => i.id === invite.id,
          )?.revokedAt !== undefined,
          true,
        );
        assert.equal((await courseForOwner(draft.id, owner)).id, draft.id);
        const expired = await team.createTeamInvite(owner, outsider.email);
        const token = expired.path.split("/").at(-1)!;
        const parsed = await team.inspectTeamInvite(token);
        await put("team-invite", {
          ...parsed.invite,
          expiresAt: "2000-01-01T00:00:00Z",
        });
        await assert.rejects(
          async () => await team.acceptTeamInvite(outsider, token),
        );
      },
    );
  } finally {
    db().close();
    rmSync(dir, { recursive: true, force: true });
  }
});
