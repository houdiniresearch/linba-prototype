import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { all, get, put, remove } from "../lib/db";
import { assignPortraits } from "../lib/agent-portraits";
import type { Course, Rehearsal } from "../lib/types";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
const courseId = randomUUID(),
  rehearsalId = randomUUID(),
  owners: string[] = [];
let cookie = "";
async function request(
  path: string,
  body?: unknown,
  method = "GET",
  expected = 200,
  authenticated = true,
) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      cookie: authenticated ? cookie : "",
      Origin: base,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = response.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const data = await response.json();
  assert.equal(response.status, expected, JSON.stringify(data));
  return data;
}
async function main() {
  const { user } = await request(
    "auth",
    {
      action: "register",
      role: "teacher",
      name: "Practice test",
      email: `practice-${randomUUID()}@linba.test`,
      password: randomUUID(),
    },
    "POST",
  );
  owners.push(user.id);
  await put<Course>("course", {
    id: courseId,
    ownerId: user.id,
    name: "Practice test",
    originalName: "Test",
    createdAt: new Date().toISOString(),
    status: "draft",
    accessDays: 7,
    autoAnswer: true,
    code: "TEST-PRACTICE",
    displayKey: randomUUID(),
    pages: [],
    slides: [],
    activeSlideId: "",
    slideVersion: 0,
  });
  const rehearsal: Rehearsal = {
    id: rehearsalId,
    courseId,
    audience: "Fictional business owners",
    createdAt: new Date().toISOString(),
    remarks: [],
    personas: [
      {
        name: "Agent",
        background: "Business owner",
        behavior: "Asks for examples",
        gender: "female",
        voice: "marin",
      },
    ],
  };
  await put("rehearsal", rehearsal);
  const path = `courses/${courseId}/rehearsal`;
  const portraitId = assignPortraits(rehearsal.personas, rehearsalId)[0]
    .portraitId;
  const voiceBody = {
    id: rehearsalId,
    action: "voice",
    personaIndex: 0,
    gender: "male",
    voice: "cedar",
  };
  await request(path, voiceBody, "PATCH", 401, false);
  const changed = await request(path, voiceBody, "PATCH");
  assert.equal(changed.rehearsal.personas[0].portraitId, portraitId);
  assert.equal(changed.rehearsal.personas[0].voice, "cedar");
  for (const durationSeconds of [-1, 1.5, "120", Number.MAX_SAFE_INTEGER + 1]) {
    await request(path, { id: rehearsalId, durationSeconds }, "PATCH", 400);
    assert.equal(
      (await get<Rehearsal>("rehearsal", rehearsalId))?.endedAt,
      undefined,
    );
  }
  const saved = await request(
    path,
    {
      id: rehearsalId,
      durationSeconds: 125,
      remarks: ["Agent: Can you give an example?"],
      feedback: {
        summary: "Explain the first example more slowly.",
        suggestions: ["Pause after questions."],
        questions: ["Can you give an example?"],
      },
    },
    "PATCH",
  );
  assert.equal(saved.rehearsal.durationSeconds, 125);
  assert.ok(saved.rehearsal.endedAt);
  assert.equal(saved.rehearsal.personas[0].portraitId, portraitId);
  const reloaded = await request(`courses/${courseId}`);
  assert.equal(reloaded.rehearsals[0].durationSeconds, 125);
  assert.equal(
    reloaded.rehearsals[0].feedback.summary,
    saved.rehearsal.feedback.summary,
  );
  await request(path, voiceBody, "PATCH", 400);
  console.log(
    "Practice persistence passed: stable portraits across voice changes, validated duration, saved feedback, reload and authentication. No model or microphone calls.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await remove("rehearsal", rehearsalId);
    await remove("course", courseId);
    for (const session of await all<{
      id: string;
      userId: string;
    }>("session"))
      if (owners.includes(session.userId)) await remove("session", session.id);
    for (const id of owners) await remove("user", id);
  });
