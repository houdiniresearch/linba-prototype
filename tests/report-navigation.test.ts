import assert from "node:assert/strict";
import test from "node:test";
import { reportTabForSection } from "../lib/report-navigation";
test("report evidence targets reveal their owning panel and unknown links stay untouched", () => {
  assert.equal(reportTabForSection("report-top"), "report-overview");
  assert.equal(reportTabForSection("report-overview"), "report-overview");
  assert.equal(reportTabForSection("report-questions"), "report-questions");
  assert.equal(
    reportTabForSection("report-topic-customer-support"),
    "report-questions",
  );
  assert.equal(reportTabForSection("report-activities"), "report-activities");
  assert.equal(reportTabForSection("unrelated"), null);
});
