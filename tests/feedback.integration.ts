import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { all, get, remove } from "../lib/db";
import type { User } from "../lib/types";
import type { FeedbackEntry } from "../lib/feedback";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
const email = `feedback-qa-${randomUUID()}@linba.test`;
let cookie = "";
let userId = "";
async function request(
  endpoint: string,
  body?: object,
  expected = 200,
  origin = base,
  signedIn = true,
) {
  const result = await fetch(`${base}/api/${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(signedIn && cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(
    result.status,
    expected,
    `${endpoint}: ${await result.clone().text()}`,
  );
  const session = result.headers.get("set-cookie");
  if (session) cookie = session.split(";")[0];
  return result.json();
}
async function main() {
  try {
    const input = {
      requestId: randomUUID(),
      message: "QA fixture: feedback persistence check",
      category: "issue",
      locale: "tr",
    };
    await request("feedback", input, 401, base, false);
    const registered = await request("auth", {
      action: "register",
      name: "Feedback QA",
      email,
      password: randomUUID(),
      role: "teacher",
    });
    userId = registered.user.id;
    const first = await request("feedback", input);
    assert.equal(get<FeedbackEntry>("feedback", first.id)?.userId, userId);
    assert.equal(
      get<FeedbackEntry>("feedback", first.id)?.message,
      input.message,
    );
    assert.deepEqual(await request("feedback", input), first);
    await request("feedback", { ...input, message: "" }, 400);
    await request("feedback", input, 403, "https://unrelated.example");
    await request("feedback", undefined, 405);
    assert.equal(
      all<FeedbackEntry>("feedback").filter((entry) => entry.userId === userId)
        .length,
      1,
    );
    console.log(
      "Feedback API: authentication, persistence, retry, validation and origin checks passed.",
    );
  } finally {
    userId ||= all<User>("user").find((user) => user.email === email)?.id || "";
    if (userId) {
      for (const entry of all<FeedbackEntry>("feedback").filter(
        (entry) => entry.userId === userId,
      ))
        remove("feedback", entry.id);
      for (const entry of all<{ id: string; userId: string }>("session").filter(
        (entry) => entry.userId === userId,
      ))
        remove("session", entry.id);
      remove("user", userId);
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
