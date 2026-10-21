import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { all, remove } from "../lib/db";
import type { WaitlistEntry } from "../lib/waitlist";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
test("public general waitlist persists one record per email and rejects invalid writes", async () => {
  const email = `waitlist-${randomUUID()}@linba.test`;
  async function request(body: unknown, status = 200, origin = base) {
    const response = await fetch(`${base}/api/public-waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, status);
    return response.json();
  }
  const records = async () =>
    (await all<WaitlistEntry>("publicWaitlist")).filter(
      (entry) => entry.email === email,
    );
  try {
    assert.deepEqual(
      await request({
        integration: "zoom",
        email: ` ${email.toUpperCase()} `,
        locale: "tr",
      }),
      { ok: true },
    );
    const first = (await records())[0];
    assert.equal(first.email, email);
    assert.equal("integration" in first, false);
    await request({ integration: "zoom", email, locale: "en" });
    assert.equal((await records()).length, 1);
    assert.equal((await records())[0].createdAt, first.createdAt);
    assert.equal((await records())[0].locale, "en");
    await request({ integration: "teams", email, locale: "tr" });
    assert.equal((await records()).length, 1);
    assert.equal("integration" in (await records())[0], false);
    await request({ integration: "zoom", email: "invalid" }, 400);
    await request(
      { integration: "zoom", email: "a".repeat(250) + "@test.example" },
      400,
    );
    await request(
      { integration: "chatgpt", email },
      403,
      "https://unrelated.example",
    );
    assert.equal((await records()).length, 1);
    assert.equal((await fetch(`${base}/api/public-waitlist`)).status, 405);
    const legacy = await fetch(`${base}/api/integration-waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ integration: "chatgpt", email }),
    });
    assert.equal(legacy.status, 200);
    assert.equal((await records()).length, 1);
  } finally {
    for (const entry of await records())
      await remove("publicWaitlist", entry.id);
  }
});
