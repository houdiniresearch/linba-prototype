import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
function client() {
  let cookie = "";
  return async (url: string, body?: unknown, method?: string, expect = 200) => {
    const response = await fetch(`${base}/api/${url}`, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        cookie,
        Origin: base,
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    const newCookie = response.headers.get("set-cookie");
    if (newCookie) cookie = newCookie.split(";")[0];
    const raw = await response.text();
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    assert.equal(
      response.status,
      expect,
      `${url}: ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );
    return data;
  };
}
async function main() {
  const teacher = client(),
    participant = client(),
    other = client(),
    p2 = client(),
    anon = client();
  const suffix = randomUUID().slice(0, 8);
  const register = (role: string, name: string, email: string) => ({
    action: "register",
    role,
    name,
    email: `${email}-${suffix}@linba.test`,
    password: randomUUID(),
  });
  await teacher("auth", register("teacher", "Test Eğitmen", "teacher"));
  await participant(
    "auth",
    register("participant", "Test Katılımcı", "participant"),
  );
  await p2("auth", register("participant", "İkinci Katılımcı", "participant2"));
  await other("auth", register("teacher", "Diğer Eğitmen", "other"));
  const { course } = await teacher("courses", {
    demo: true,
    name: "Uçtan uca test",
    accessDays: 7,
  });
  const id = course.id;
  await other(`courses/${id}`, undefined, "GET", 403);
  await participant(`courses/${id}`, undefined, "GET", 403);
  await participant("courses", { demo: true }, "POST", 403);
  await anon(`courses/${id}`, undefined, "GET", 401);
  await participant("join", { code: course.code });
  await p2("join", { code: course.code });
  await participant(
    `courses/${id}/questions`,
    { text: "Hedef kitle nedir?" },
    "POST",
    403,
  );
  const s = await teacher(
    `courses/${id}`,
    {
      action: "add-activity",
      afterId: course.slides[0].id,
      activity: {
        type: "poll",
        question: "Hangi kanalla başlarsın?",
        options: ["Sosyal medya", "E-posta"],
      },
    },
    "PATCH",
  );
  const activity = s.course.slides.find((s: any) => s.kind === "activity");
  assert.ok(activity);
  await teacher(
    `courses/${id}`,
    {
      action: "reorder",
      ids: [...s.course.slides].reverse().map((s: any) => s.id),
    },
    "PATCH",
    400,
  );
  await participant(`courses/${id}`, { action: "start" }, "PATCH", 404);
  await teacher(`courses/${id}`, { action: "start" }, "PATCH");
  await teacher(
    `courses/${id}`,
    { action: "select", slideId: activity.id },
    "PATCH",
  );
  await participant(`courses/${id}/responses`, {
    slideId: activity.id,
    value: "Sosyal medya",
  });
  await p2(`courses/${id}/responses`, {
    slideId: activity.id,
    value: "E-posta",
  });
  assert.equal((await participant(`courses/${id}`)).responses.length, 1);
  const supported = await participant(`courses/${id}/questions`, {
    text: "Hedef kitle nedir, persona ile farkı nedir?",
  });
  assert.equal(supported.question.status, "answered");
  assert.ok(supported.question.sources.includes(2));
  assert.ok(supported.question.answer);
  const similar = await p2(`courses/${id}/questions`, {
    text: "Persona ve hedef kitle arasındaki farkı açıklar mısın?",
  });
  const grouped = (await teacher(`courses/${id}`)).questions;
  assert.equal(
    grouped.find((q: any) => q.id === similar.question.id).groupId,
    grouped.find((q: any) => q.id === supported.question.id).groupId,
  );
  assert.equal(similar.question.groupId, "");
  const unsupported = await participant(`courses/${id}/questions`, {
    text: "Kuantum bilgisayarın donanımı nasıl tasarlanır?",
  });
  assert.equal(unsupported.question.status, "escalated");
  assert.equal(unsupported.question.answer, undefined);
  assert.equal((await participant(`courses/${id}`)).questions.length, 2);
  assert.equal((await p2(`courses/${id}`)).questions.length, 1);
  assert.equal((await teacher(`courses/${id}`)).questions.length, 3);
  const publicState = await anon(`presentation/${id}?key=${course.displayKey}`);
  assert.equal(publicState.course.ownerId, "");
  assert.ok(!("questions" in publicState));
  assert.equal(
    typeof (await anon(`courses/${id}/page/1?key=${course.displayKey}`)),
    "string",
  );
  const generated = await teacher(`courses/${id}/generate-activity`, {
    type: "open",
    pageId: course.pages[1].id,
  });
  assert.ok(generated.activity.question);
  assert.equal(generated.activity.type, "open");
  const personas = await teacher(`courses/${id}/rehearsal`, {
    audience:
      "Dijital pazarlamaya yeni başlayan küçük işletme sahipleri, bazıları bütçe ayırmaktan çekiniyor.",
  });
  assert.ok(personas.rehearsal.personas.length >= 2);
  await teacher(
    `courses/${id}`,
    { action: "settings", name: course.name, accessDays: 7, autoAnswer: false },
    "PATCH",
  );
  const direct = await participant(`courses/${id}/questions`, {
    text: "Persona ve hedef kitle arasındaki farkı tekrar açıklar mısınız?",
  });
  assert.equal(direct.question.status, "manual");
  assert.equal(direct.question.answer, undefined);
  const afterDirect = (await teacher(`courses/${id}`)).questions;
  assert.equal(
    afterDirect.find((q: any) => q.id === direct.question.id).groupId,
    afterDirect.find((q: any) => q.id === supported.question.id).groupId,
  );
  await teacher(
    `courses/${id}`,
    { action: "addressed", questionId: direct.question.id, value: true },
    "PATCH",
  );
  assert.equal(
    (await participant(`courses/${id}`)).questions.find(
      (q: any) => q.id === direct.question.id,
    ).addressed,
    true,
  );
  await teacher(`courses/${id}`, { action: "end" }, "PATCH");
  const ended = await teacher(`courses/${id}`);
  assert.equal(ended.course.status, "ended");
  assert.ok(ended.course.report.summary);
  assert.equal(ended.responses.length, 2);
  assert.equal(ended.course.report.ai, true);
  const followup = await participant(`courses/${id}/questions`, {
    text: "Başlangıç bütçesi nasıl belirlenir?",
  });
  assert.equal(followup.question.stage, "followup");
  assert.equal(followup.question.status, "answered");
  assert.equal((await teacher(`courses/${id}`)).questions.length, 5);
  await teacher(`courses/${id}`, { action: "start" }, "PATCH", 400);
  for (const ext of ["pdf", "pptx"]) {
    const bytes = await readFile(join(tmpdir(), `linba-fixture.${ext}`));
    const form = new FormData();
    form.set("file", new File([bytes], `test.${ext}`));
    form.set("name", `Gerçek ${ext.toUpperCase()} yükleme`);
    form.set("accessDays", "7");
    form.set("autoAnswer", "true");
    const upload = await teacher("courses", form);
    assert.equal(upload.course.pages.length, 2);
    assert.ok(upload.course.pages[0].text.includes("Target audience"));
    await teacher(`courses/${upload.course.id}/page/1`);
  }
  await teacher(
    `courses/${id}`,
    { action: "settings", name: "Test", accessDays: 0, autoAnswer: false },
    "PATCH",
  );
  await participant(`courses/${id}`, undefined, "GET", 410);
  const result = {
    passed: true,
    checks: [
      "account isolation",
      "presentation privacy",
      "activity responses",
      "document citations",
      "semantic question groups",
      "unsupported escalation",
      "AI activity",
      "generated personas",
      "end report",
      "post-training RAG",
      "PDF upload",
      "PPTX upload",
      "expiry",
    ],
    courseId: id,
    model: "gpt-realtime-2.1-mini",
  };
  await mkdir("output/playwright", { recursive: true });
  await writeFile(
    "output/playwright/api-validation.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
