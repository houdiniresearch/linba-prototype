import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { all, remove } from "../lib/db";
import { translate } from "../lib/translations";

const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
test("language catalog translates UI and preserves training content", () => {
  assert.equal(translate("Eğitimlerim", "en"), "My training");
  assert.equal(translate("Eğitimlerim", "tr"), "Eğitimlerim");
  assert.equal(
    translate("{count} katılımcı", "en", { count: 12 }),
    "12 participants",
  );
  assert.equal(
    translate("A user’s original training title", "en"),
    "A user’s original training title",
  );
});

test("waitlist persists per account, validates input and rejects cross-origin writes", async () => {
  const ids: string[] = [];
  function client() {
    let cookie = "";
    return async (
      path: string,
      body?: unknown,
      method = body ? "POST" : "GET",
      status = 200,
      origin = base,
    ) => {
      const response = await fetch(`${base}/api/${path}`, {
        method,
        headers: { cookie, Origin: origin, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0];
      const raw = await response.text();
      const value = raw ? JSON.parse(raw) : {};
      assert.equal(
        response.status,
        status,
        `${path}: expected ${status}, got ${response.status}`,
      );
      return value;
    };
  }
  const first = client(),
    second = client(),
    anonymous = client();
  try {
    for (const request of [first, second]) {
      const result = await request("auth", {
        action: "register",
        role: "teacher",
        name: "Header test",
        email: `header-${randomUUID()}@linba.test`,
        password: randomUUID(),
      });
      ids.push(result.user.id);
    }
    await anonymous("waitlist", undefined, "GET", 401);
    assert.equal((await first("waitlist")).entry, null);
    await first("waitlist", { email: "invalid", locale: "en" }, "POST", 400);
    assert.equal((await first("waitlist")).entry, null);
    const joined = (
      await first("waitlist", {
        email: " Header-First@linba.test ",
        locale: "tr",
        userId: ids[1],
      })
    ).entry;
    assert.equal(joined.id, ids[0]);
    assert.equal(joined.email, "header-first@linba.test");
    assert.equal((await second("waitlist")).entry, null);
    const updated = (
      await first("waitlist", {
        email: "header-second@linba.test",
        locale: "en",
      })
    ).entry;
    assert.equal(updated.createdAt, joined.createdAt);
    assert.equal(updated.locale, "en");
    assert.equal(
      (await first("waitlist")).entry.email,
      "header-second@linba.test",
    );
    assert.equal(
      all<{ id: string }>("waitlist").filter((e) => e.id === ids[0]).length,
      1,
    );
    await first(
      "waitlist",
      { email: "forbidden@linba.test" },
      "POST",
      403,
      "https://unrelated.example",
    );
    assert.equal(
      (await first("waitlist")).entry.email,
      "header-second@linba.test",
    );
    await first("waitlist", {}, "PUT", 405);
    const english = await (
      await fetch(base, { headers: { Cookie: "linba_locale=en" } })
    ).text();
    assert.match(english, /<html[^>]*lang="en"/);
  } finally {
    for (const session of all<{ id: string; userId: string }>("session"))
      if (ids.includes(session.userId)) remove("session", session.id);
    for (const id of ids) {
      remove("waitlist", id);
      remove("user", id);
    }
  }
});
