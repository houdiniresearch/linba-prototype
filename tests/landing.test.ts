import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { all, remove } from "../lib/db";

const base = process.env.LINBA_TEST_URL || "http://localhost:3000";

test("prelaunch welcome and existing login preserve authenticated workspace access", async () => {
  const root = await fetch(base);
  assert.equal(root.status, 200);
  assert.match(await root.text(), /class="landing-page"/);
  const preview = await fetch(`${base}/explore`);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /class="landing-page"/);

  for (const path of ["/login", "/login?mode=signup"]) {
    const welcome = await (await fetch(`${base}${path}`)).text();
    assert.match(welcome, /access-waitlist-form/);
    assert.match(welcome, /LİNBA ajanlarını deneyimle/);
    assert.doesNotMatch(welcome, /type="password"/i);
  }
  const login = await (await fetch(`${base}/login?mode=signin`)).text();
  assert.match(login, /autoComplete="current-password"/i);
  assert.doesNotMatch(login, /autoComplete="name"/i);

  let userId: string | undefined;
  try {
    const registered = await fetch(`${base}/api/auth`, {
      method: "POST",
      headers: { Origin: base, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        role: "teacher",
        name: "Landing route test",
        email: `landing-${randomUUID()}@linba.test`,
        password: randomUUID(),
      }),
    });
    assert.equal(registered.status, 200);
    userId = (await registered.json()).user.id;
    const cookie = registered.headers.get("set-cookie")!.split(";")[0];
    const workspace = await fetch(base, { headers: { Cookie: cookie } });
    assert.equal(workspace.status, 200);
    assert.doesNotMatch(await workspace.text(), /class="landing-page"/);
    const existingAccount = await fetch(`${base}/login?mode=signup`, {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    // Next may stream the loading boundary before the server redirect resolves.
    if (existingAccount.status === 307) {
      assert.equal(existingAccount.headers.get("location"), "/");
    } else {
      assert.equal(existingAccount.status, 200);
      assert.match(
        await existingAccount.text(),
        /<meta(?=[^>]*http-equiv="refresh")(?=[^>]*content="[^"]*url=\/")[^>]*>/i,
      );
    }
    const loggedOut = await fetch(`${base}/api/auth`, {
      method: "DELETE",
      headers: { Cookie: cookie, Origin: base },
    });
    assert.equal(loggedOut.status, 200);
    const publicAgain = await fetch(base, { headers: { Cookie: cookie } });
    assert.match(await publicAgain.text(), /class="landing-page"/);
  } finally {
    if (userId) {
      for (const session of all<{ id: string; userId: string }>("session"))
        if (session.userId === userId) remove("session", session.id);
      remove("user", userId);
    }
  }
});
