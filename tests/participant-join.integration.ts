import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { all, get, put, remove } from "../lib/db";
import { discardPresentationAssets } from "../lib/presentation-storage";
import { supabaseServer, usesSupabase } from "../lib/supabase-server";
import type { Course } from "../lib/types";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
const users = new Set<string>();
const courses = new Set<string>();
function client() {
  const cookies = new Map<string, string>();
  return {
    cookies,
    async request(
      endpoint: string,
      body?: object,
      method = body ? "POST" : "GET",
      status = 200,
    ) {
      const response = await fetch(`${base}/api/${endpoint}`, {
        method,
        headers: {
          Origin: base,
          Cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      for (const header of response.headers.getSetCookie()) {
        const pair = header.split(";")[0];
        const equals = pair.indexOf("=");
        cookies.set(pair.slice(0, equals), pair.slice(equals + 1));
        if (!pair.endsWith("=")) assert.match(header, /HttpOnly/iu);
      }
      const data = response.headers.get("content-type")?.includes("json")
        ? await response.json()
        : await response.text();
      assert.equal(
        response.status,
        status,
        `${endpoint}: ${JSON.stringify(data)}`,
      );
      return data;
    },
  };
}
async function main() {
  const teacher = client(),
    first = client(),
    second = client(),
    registered = client();
  const email = `guest-flow-${randomUUID()}@linba.test`,
    password = randomUUID();
  try {
    const teacherUser = (
      await teacher.request("auth", {
        action: "register",
        role: "teacher",
        name: "Guest flow QA",
        email,
        password,
      })
    ).user;
    users.add(teacherUser.id);
    const course: Course = (
      await teacher.request("courses", {
        demo: true,
        name: "Nickname participation QA",
        autoAnswer: false,
      })
    ).course;
    courses.add(course.id);
    const endpoint = `participant/courses/${course.id}`;
    assert.equal((await first.request("participant/auth")).user, undefined);
    const before = (await all("user")).length;
    await first.request(
      "participant/join",
      { asGuest: true, code: course.code, nickname: "a" },
      "POST",
      400,
    );
    await first.request(
      "participant/join",
      { asGuest: true, code: "000000", nickname: "Deniz" },
      "POST",
      404,
    );
    assert.equal((await all("user")).length, before);
    const badOrigin = await fetch(`${base}/api/participant/join`, {
      method: "POST",
      headers: {
        Origin: "https://elsewhere.test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asGuest: true,
        code: course.code,
        nickname: "Deniz",
      }),
    });
    assert.equal(badOrigin.status, 403);
    assert.equal((await all("user")).length, before);
    for (const guest of [first, second]) {
      const joined = await guest.request("participant/join", {
        asGuest: true,
        code: course.code,
        nickname: "Deniz",
      });
      users.add(joined.user.id);
      assert.equal(joined.user.guest, true);
      assert.equal(joined.user.email, "");
      assert.equal(joined.id, course.id);
      assert.ok(guest.cookies.get("linba_participant_session"));
      assert.equal(guest.cookies.get("linba_session"), undefined);
      assert.equal((await guest.request(endpoint)).questions.length, 0);
      assert.match(await guest.request(`${endpoint}/page/1`), /svg/);
    }
    const firstUser = (await first.request("participant/auth")).user;
    const secondUser = (await second.request("participant/auth")).user;
    assert.notEqual(firstUser.id, secondUser.id);
    await first.request(`courses/${course.id}`, undefined, "GET", 401);
    await first.request(endpoint, { action: "start" }, "PATCH", 403);
    await first.request("participant/courses", { demo: true }, "POST", 403);
    await first.request(
      `participant/reports/${course.id}`,
      undefined,
      "GET",
      404,
    );
    await first.request(
      `${endpoint}/questions`,
      { text: "Not live yet" },
      "POST",
      403,
    );
    const updated = await teacher.request(
      `courses/${course.id}`,
      {
        action: "add-activity",
        afterId: course.slides[0].id,
        activity: {
          type: "poll",
          question: "Hangi seçenek?",
          options: ["A", "B"],
        },
      },
      "PATCH",
    );
    const activity = updated.course.slides.find(
      (slide: { kind: string }) => slide.kind === "activity",
    );
    await teacher.request(`courses/${course.id}`, { action: "start" }, "PATCH");
    await teacher.request(
      `courses/${course.id}`,
      { action: "select", slideId: activity.id },
      "PATCH",
    );
    await first.request(`${endpoint}/responses`, {
      slideId: activity.id,
      value: "A",
    });
    await second.request(`${endpoint}/responses`, {
      slideId: activity.id,
      value: "B",
    });
    assert.equal((await first.request(endpoint)).responses[0].value, "A");
    assert.equal((await second.request(endpoint)).responses[0].value, "B");
    // Saved history must stay private even when nicknames are identical.
    await put("question", {
      id: `guest-qa-${course.id}`,
      courseId: course.id,
      userId: firstUser.id,
      userName: "Deniz",
      text: "Private question",
      status: "manual",
      groupId: "private-group",
      groupTitle: "private-topic",
      createdAt: new Date().toISOString(),
      sources: [],
      stage: "live",
    });
    const state = await first.request(endpoint);
    assert.equal(state.questions.length, 1);
    assert.equal(state.questions[0].groupId, "");
    assert.equal((await second.request(endpoint)).questions.length, 0);
    assert.equal(
      (await teacher.request(`courses/${course.id}`)).responses.length,
      2,
    );
    // Guest identity and participation survive a page reload (the same cookies).
    assert.equal(
      (await first.request("participant/auth")).user.id,
      firstUser.id,
    );
    assert.equal(
      (
        await first.request("participant/join", {
          asGuest: true,
          code: course.code,
          nickname: "Deniz",
        })
      ).user.id,
      firstUser.id,
    );
    // Both identities can coexist; the guest cannot borrow teacher privileges.
    const mainCookie = teacher.cookies.get("linba_session");
    const guestInTeacherBrowser = await teacher.request("participant/join", {
      asGuest: true,
      code: course.code,
      nickname: "Eğitmen testi",
    });
    users.add(guestInTeacherBrowser.user.id);
    assert.equal(teacher.cookies.get("linba_session"), mainCookie);
    assert.equal((await teacher.request("auth")).user.id, teacherUser.id);
    assert.equal(
      (await teacher.request("participant/auth")).user.id,
      guestInTeacherBrowser.user.id,
    );
    await teacher.request("participant/courses", { demo: true }, "POST", 403);
    await teacher.request(endpoint, { action: "start" }, "PATCH", 403);
    await teacher.request("participant/auth", undefined, "DELETE");
    assert.equal((await teacher.request("participant/auth")).user, undefined);
    assert.equal((await teacher.request("auth")).user.id, teacherUser.id);
    await registered.request(
      "participant/auth",
      { action: "login", email, password },
      "POST",
      403,
    );
    assert.equal(
      (await registered.request("participant/auth")).user,
      undefined,
    );
    const participantEmail = `guest-registered-${randomUUID()}@linba.test`;
    const participant = (
      await registered.request("participant/auth", {
        action: "register",
        role: "participant",
        name: "Registered participant",
        email: participantEmail,
        password,
      })
    ).user;
    users.add(participant.id);
    assert.equal(participant.role, "participant");
    await registered.request("participant/join", { code: course.code });
    await registered.request("participant/auth", undefined, "DELETE");
    await registered.request("participant/auth", {
      action: "login",
      email: participantEmail,
      password,
    });
    assert.equal((await registered.request(endpoint)).course.id, course.id);
    assert.equal((await registered.request("auth")).user, undefined);
    const expired = {
      ...(await get<Course>("course", course.id))!,
      status: "ended" as const,
      endedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    };
    await put("course", expired);
    await second.request(
      "participant/join",
      { asGuest: true, code: course.code, nickname: "New nickname" },
      "POST",
      404,
    );
    await first.request(endpoint, undefined, "GET", 410);
    console.log(
      "PASS: guest joining, validation, private history, activity responses, session persistence, independent teacher session, account login and access expiry.",
    );
  } finally {
    for (const kind of [
      "course",
      "member",
      "question",
      "response",
      "session",
      "user",
    ]) {
      for (const record of await all<{
        id: string;
        courseId?: string;
        userId?: string;
      }>(kind)) {
        if (
          courses.has(record.id) ||
          users.has(record.id) ||
          courses.has(record.courseId || "") ||
          users.has(record.userId || "")
        )
          await remove(kind, record.id);
      }
    }
    for (const id of courses) await discardPresentationAssets(id);
    if (usesSupabase() && courses.size)
      await supabaseServer()
        .from("linba_documents")
        .delete()
        .in("course_id", [...courses]);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
