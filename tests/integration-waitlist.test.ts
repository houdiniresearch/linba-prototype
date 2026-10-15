import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { all, remove } from "../lib/db";
import type { IntegrationWaitlistEntry } from "../lib/waitlist";

const base = process.env.LINBA_TEST_URL || "http://localhost:3000";

test("public integration waitlist persists, deduplicates per integration and rejects invalid writes", async () => {
  const email = `integration-${randomUUID()}@linba.test`;
  async function request(body: unknown, status = 200, origin = base) {
    const response = await fetch(`${base}/api/integration-waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, status);
    return response.json();
  }
  const records = () =>
    all<IntegrationWaitlistEntry>("integrationWaitlist").filter(
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
    const first = records()[0];
    assert.equal(first.email, email);
    assert.equal(first.integration, "zoom");
    await request({ integration: "zoom", email, locale: "en" });
    assert.equal(records().length, 1);
    assert.equal(records()[0].createdAt, first.createdAt);
    assert.equal(records()[0].locale, "en");
    await request({ integration: "teams", email, locale: "tr" });
    assert.equal(records().length, 2);
    await request({ integration: "unknown", email }, 400);
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
    assert.equal(records().length, 2);
    assert.equal((await fetch(`${base}/api/integration-waitlist`)).status, 405);
  } finally {
    for (const entry of records()) remove("integrationWaitlist", entry.id);
  }
});
