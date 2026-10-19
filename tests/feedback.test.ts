import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { User } from "../lib/types";

test("feedback validates input, persists account ownership and safely retries", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "linba-feedback-"));
  process.env.LINBA_DATA_DIR = directory;
  const { saveFeedback } = await import("../lib/feedback");
  const { all, db } = await import("../lib/db");
  const user: User = {
    id: "teacher",
    name: "Test",
    email: "test@linba.test",
    role: "teacher",
  };
  const input = {
    requestId: "12345678-1234-1234-1234-123456789abc",
    category: "idea",
    message: "  Let me organize my training.  ",
    locale: "en",
    userId: "someone-else",
  };
  try {
    const first = saveFeedback(user, input);
    assert.equal(first.userId, user.id);
    assert.equal(first.message, "Let me organize my training.");
    assert.equal(first.locale, "en");
    assert.deepEqual(saveFeedback(user, input), first);
    assert.equal(all("feedback").length, 1);
    saveFeedback({ ...user, id: "other" }, input);
    assert.equal(all("feedback").length, 2);
    for (const bad of [
      null,
      { ...input, message: "  " },
      { ...input, message: "x".repeat(2001) },
      { ...input, message: {} },
      { ...input, category: "invalid" },
      { ...input, requestId: "bad" },
    ])
      assert.throws(() => saveFeedback(user, bad));
    assert.equal(all("feedback").length, 2);
  } finally {
    db().close();
    rmSync(directory, { recursive: true, force: true });
  }
});
