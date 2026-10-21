import test from "node:test";
import assert from "node:assert/strict";
import { groundedAnalysis } from "../lib/ai-analysis";
import { structuredResponse } from "../lib/ai-runtime";
import { reportContract } from "../lib/ai-contracts";

test("analysis audit repairs an unsupported inference once and never publishes an unchecked repair", async () => {
  const tasks: string[] = [];
  const generate: typeof structuredResponse = async (
    task,
    contract,
    instructions,
  ) => {
    tasks.push(task);
    if (task === "audit")
      return contract.parse({
        supported: tasks.length === 4,
        issues:
          tasks.length === 2
            ? ["Response popularity is not evidence of learning."]
            : [],
      });
    if (tasks.length === 3)
      assert(instructions.includes("Response popularity"));
    return contract.parse({
      summary:
        tasks.length === 1
          ? "The class understood the topic."
          : "16 of 23 responses selected SOM.",
      recommendations: [],
    });
  };
  const result = await groundedAnalysis(
    "report",
    reportContract,
    "prompt",
    JSON.stringify({ counts: { responses: 23 } }),
    generate,
  );
  assert.equal(result.summary, "16 of 23 responses selected SOM.");
  assert.deepEqual(tasks, ["report", "audit", "report", "audit"]);
});
test("repeated unsupported analyses fail without unbounded repairs or success-shaped fallback", async () => {
  let calls = 0;
  const generate: typeof structuredResponse = async (task, contract) => {
    calls++;
    return contract.parse(
      task === "audit"
        ? { supported: false, issues: ["Invented success score"] }
        : { summary: "Class success: 99%", recommendations: [] },
    );
  };
  await assert.rejects(
    groundedAnalysis("report", reportContract, "prompt", "{}", generate),
    /AI_UNSUPPORTED_ANALYSIS/,
  );
  assert.equal(calls, 4);
});
