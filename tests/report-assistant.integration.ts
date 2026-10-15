import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { all, put, remove } from "../lib/db";
import type { Course, User } from "../lib/types";
import type { ReportChat } from "../lib/report-chat";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
const owners: string[] = [],
  courses: string[] = [];
function client() {
  let cookie = "";
  return async (path: string, body?: unknown, status = 200, origin = base) => {
    const response = await fetch(`${base}/api/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { cookie, Origin: origin, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = response.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const data = await response.json();
    assert.equal(response.status, status, `${path}: ${JSON.stringify(data)}`);
    return data;
  };
}
const teacher = client(),
  other = client(),
  learner = client(),
  anonymous = client();
async function main() {
  const users: User[] = [];
  for (const [request, role] of [
    [teacher, "teacher"],
    [other, "teacher"],
    [learner, "participant"],
  ] as const) {
    const { user } = await request("auth", {
      action: "register",
      role,
      name: "Report integration",
      email: `report-${randomUUID()}@linba.test`,
      password: randomUUID(),
    });
    users.push(user);
    owners.push(user.id);
  }
  const make = (
    ownerId: string,
    name: string,
    status: Course["status"] = "ended",
  ) => {
    const id = randomUUID();
    courses.push(id);
    const course: Course = {
      id,
      ownerId,
      name,
      status,
      createdAt: new Date().toISOString(),
      endedAt: status === "ended" ? new Date().toISOString() : undefined,
      originalName: "Integration",
      accessDays: 7,
      autoAnswer: true,
      code: String(Math.floor(Math.random() * 900000) + 100000),
      displayKey: randomUUID(),
      pages: [],
      slides: [
        {
          id: "activity",
          kind: "activity",
          activity: {
            type: "poll",
            question: "Hangi kanal?",
            options: ["Sosyal medya", "E-posta"],
          },
        },
      ],
      activeSlideId: "activity",
      slideVersion: 0,
    };
    put("course", course);
    return course;
  };
  const first = make(users[0].id, "Kayıt testi"),
    second = make(users[0].id, "Bağımsız rapor"),
    foreign = make(users[1].id, "Yabancı rapor"),
    draft = make(users[0].id, "Taslak", "draft");
  for (let i = 0; i < 2; i++) {
    put("member", {
      id: `${first.id}:${i}`,
      courseId: first.id,
      userId: `member-${i}`,
      name: `Kişi ${i + 1}`,
    });
    put("question", {
      id: randomUUID(),
      courseId: first.id,
      userId: `member-${i}`,
      userName: `Kişi ${i + 1}`,
      text: i
        ? "E-posta için nasıl başlanır?"
        : "Hedef kitle nasıl belirlenir?",
      answer: "Doküman yanıtı",
      status: "answered",
      groupId: `topic-${i}`,
      groupTitle: i ? "E-posta" : "Hedef kitle",
      sources: [1],
      stage: "live",
      createdAt: new Date().toISOString(),
    });
    put("response", {
      id: randomUUID(),
      courseId: first.id,
      slideId: "activity",
      userId: `member-${i}`,
      userName: `Kişi ${i + 1}`,
      value: i ? "E-posta" : "Sosyal medya",
      createdAt: new Date().toISOString(),
    });
  }
  await anonymous("report-assistant", undefined, 401);
  await learner("report-assistant", undefined, 403);
  await other(`report-assistant/${first.id}`, undefined, 404);
  await teacher(`report-assistant/${foreign.id}`, undefined, 404);
  await teacher(`report-assistant/${draft.id}`, undefined, 409);
  const list = await teacher("report-assistant");
  assert.deepEqual(
    list.reports.map((r: { id: string }) => r.id).sort(),
    [first.id, second.id].sort(),
  );
  assert.equal((await teacher(`report-assistant/${first.id}`)).turns.length, 0);
  const bad = {
    message: "test",
    requestId: randomUUID(),
    previousTurnId: null,
  };
  await teacher(`report-assistant/${first.id}`, { ...bad, message: "" }, 400);
  await teacher(
    `report-assistant/${first.id}`,
    bad,
    403,
    "https://unrelated.example",
  );
  await other(`report-assistant/${first.id}`, bad, 404);
  if (process.env.LINBA_TEST_AI === "true") {
    const body = {
      message:
        "Kaç katılımcı, kaç soru ve kaç aktivite yanıtı var? Kısa bir cümleyle sayıları söyle.",
      requestId: randomUUID(),
      previousTurnId: null,
      locale: "tr",
    };
    const result: ReportChat = await teacher(
      `report-assistant/${first.id}`,
      body,
    );
    assert.equal(result.turns.length, 1);
    assert.match(result.turns[0].answer, /2/);
    assert(
      result.turns[0].sources.every((s) =>
        ["counts", "questions", "activities"].includes(s.id),
      ),
    );
    const retry: ReportChat = await teacher(
      `report-assistant/${first.id}`,
      body,
    );
    assert.equal(retry.turns.length, 1);
    assert.equal(retry.turns[0].id, result.turns[0].id);
    const follow = {
      message:
        "Bu sayılardan öğrenme başarısını yüzde olarak hesaplayabilir misin?",
      requestId: randomUUID(),
      previousTurnId: result.turns[0].id,
      locale: "tr",
    };
    const next: ReportChat = await teacher(
      `report-assistant/${first.id}`,
      follow,
    );
    assert.equal(next.turns.length, 2);
    assert.match(next.turns[1].answer, /hesapla|ölç|yeter|başarı|veri/i);
    assert.equal(
      (await teacher(`report-assistant/${first.id}`)).turns.length,
      2,
    );
    assert.equal(
      (await teacher(`report-assistant/${second.id}`)).turns.length,
      0,
    );
    console.log(
      "Actual model answers:",
      JSON.stringify(
        next.turns.map((turn) => ({
          answer: turn.answer,
          sources: turn.sources.map((s) => s.id),
        })),
        null,
        2,
      ),
    );
  }
  console.log(
    "Report assistant API checks passed: authentication, ownership, report isolation, input validation, origin checks, persistence and retries.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const kind of ["member", "question", "response", "report-turn"]) {
      for (const record of all<{ id: string; courseId?: string }>(kind))
        if (record.courseId && courses.includes(record.courseId))
          remove(kind, record.id);
    }
    for (const id of courses) remove("course", id);
    for (const session of all<{ id: string; userId: string }>("session"))
      if (owners.includes(session.userId)) remove("session", session.id);
    for (const id of owners) remove("user", id);
  });
