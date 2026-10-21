import test from "node:test";
import assert from "node:assert/strict";
import {
  practiceBudgetReached,
  PRACTICE_LIMIT_SECONDS,
} from "../lib/practice-clock";
import { personaDescription } from "../lib/practice-description";

test("practice budget ends at 90 seconds and persisted expiry prevents extending it by reconnecting", () => {
  assert.equal(PRACTICE_LIMIT_SECONDS, 90);
  assert.equal(practiceBudgetReached(89, undefined), false);
  assert.equal(practiceBudgetReached(90, undefined), true);
  const deadline = Date.parse("2026-10-21T10:01:30Z");
  assert.equal(
    practiceBudgetReached(1, new Date(deadline).toISOString(), deadline - 1),
    false,
  );
  assert.equal(
    practiceBudgetReached(1, new Date(deadline).toISOString(), deadline),
    true,
  );
  assert.equal(practiceBudgetReached(1, deadline, deadline + 60_000), true);
  assert.equal(practiceBudgetReached(0, 0, deadline), false);
});
test("participant description is one natural paragraph with legacy simulation prefixes removed", () => {
  assert.equal(
    personaDescription(
      "Kurgusal olarak, küçük bir işletme yönetiyor.\n\nSatışlarını anlamak istiyor.",
    ),
    "Küçük bir işletme yönetiyor. Satışlarını anlamak istiyor.",
  );
  assert.equal(
    personaDescription("Elif bir ürün tasarımcısı. Görüşmelerde yeni."),
    "Elif bir ürün tasarımcısı. Görüşmelerde yeni.",
  );
  assert.equal(personaDescription("  "), "");
});
