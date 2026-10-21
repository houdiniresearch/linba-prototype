import test from "node:test";
import assert from "node:assert/strict";
import {
  structuredResponse,
  recentAIRuns,
  textModelName,
  type RuntimeDependencies,
} from "../lib/ai-runtime";
import { groupContract } from "../lib/ai-contracts";

const valid = { groupId: null, groupTitle: "Kanal seçimi" };
const response = (value: unknown = valid, extra = {}) =>
  Response.json(
    {
      id: "resp_test",
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(value) }],
        },
      ],
      usage: {
        input_tokens: 100,
        output_tokens: 30,
        input_tokens_details: { cached_tokens: 20 },
      },
      ...extra,
    },
    { headers: { "x-request-id": "req_test" } },
  );
test("structured runtime isolates text models, sends strict schemas, reports real usage and retains metadata only", async () => {
  const saved = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-secret-not-for-logs";
  const savedVoice = process.env.OPENAI_MODEL;
  process.env.OPENAI_MODEL = "a-voice-model";
  try {
    assert.notEqual(textModelName(), process.env.OPENAI_MODEL);
    let usageModel = "";
    const result = await structuredResponse(
      "group",
      groupContract,
      "Instructions",
      "PRIVATE_PARTICIPANT_DATA",
      (_id, usage, model) => {
        assert.equal(usage.input_token_details?.cached_tokens, 20);
        usageModel = model!;
      },
      {
        fetch: async (url, init) => {
          assert.equal(url, "https://api.openai.com/v1/responses");
          const body = JSON.parse(String(init?.body));
          assert.equal(body.store, false);
          assert.equal(body.text.format.strict, true);
          assert.equal(body.text.format.schema.additionalProperties, false);
          assert.equal(body.model, textModelName("group"));
          assert(init?.signal);
          return response();
        },
      },
    );
    assert.deepEqual(result, valid);
    assert.equal(usageModel, textModelName("group"));
    const trace = recentAIRuns().at(-1)!;
    assert.equal(trace.status, "ready");
    assert.equal(trace.providerRequestId, "req_test");
    assert.equal(trace.inputTokens, 100);
    assert(
      !JSON.stringify(recentAIRuns()).includes("PRIVATE_PARTICIPANT_DATA"),
    );
    assert(
      !JSON.stringify(recentAIRuns()).includes("test-secret-not-for-logs"),
    );
  } finally {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
    if (savedVoice === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = savedVoice;
  }
});
test("transient errors and invalid structured output have a bounded shared retry budget", async () => {
  const saved = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test";
  try {
    for (const first of [
      () =>
        new Response(null, { status: 429, headers: { "retry-after": "1" } }),
      () => new Response(null, { status: 503 }),
      () => response({ groupId: [], groupTitle: "bad" }),
    ]) {
      let calls = 0;
      const delays: number[] = [];
      const deps: RuntimeDependencies = {
        fetch: async () => (++calls === 1 ? first() : response()),
        sleep: async (ms) => {
          delays.push(ms);
        },
      };
      assert.deepEqual(
        await structuredResponse(
          "group",
          groupContract,
          "instructions",
          "input",
          undefined,
          deps,
        ),
        valid,
      );
      assert.equal(calls, 2);
      assert.equal(delays.length, 1);
    }
    let calls = 0;
    await assert.rejects(
      structuredResponse(
        "group",
        groupContract,
        "instructions",
        "input",
        undefined,
        {
          fetch: async () => {
            calls++;
            return response({ groupTitle: 12 });
          },
          sleep: async () => {},
        },
      ),
      /AI_INVALID_OUTPUT/,
    );
    assert.equal(calls, 2);
  } finally {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
  }
});
test("auth errors, refusals and truncated results cannot become successful output or retry storms", async () => {
  const saved = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test";
  try {
    for (const [make, code] of [
      [() => new Response(null, { status: 401 }), "AI_HTTP_401"],
      [() => response(valid, { status: "incomplete" }), "AI_INCOMPLETE"],
      [
        () =>
          response(valid, {
            output: [
              {
                type: "message",
                content: [{ type: "refusal", refusal: "Refused" }],
              },
            ],
          }),
        "AI_REFUSED",
      ],
    ] as const) {
      let calls = 0;
      await assert.rejects(
        structuredResponse(
          "group",
          groupContract,
          "instructions",
          "input",
          undefined,
          {
            fetch: async () => {
              calls++;
              return make();
            },
          },
        ),
        new RegExp(code),
      );
      assert.equal(calls, 1);
    }
    await assert.rejects(
      structuredResponse(
        "group",
        groupContract,
        "instructions",
        "x".repeat(180001),
      ),
      /AI_CONTEXT_TOO_LARGE/,
    );
    await assert.rejects(
      structuredResponse(
        "group",
        groupContract,
        "instructions",
        "input",
        undefined,
        {
          timeoutMs: 5,
          fetch: async (_url, init) =>
            new Promise((_resolve, reject) =>
              init?.signal?.addEventListener("abort", () =>
                reject(new Error("aborted")),
              ),
            ),
        },
      ),
      /AI_TIMEOUT/,
    );
  } finally {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
  }
});

test("a usage persistence failure cannot trigger another billed provider response", async () => {
  const saved = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test";
  let calls = 0;
  try {
    await assert.rejects(
      structuredResponse(
        "group",
        groupContract,
        "instructions",
        "input",
        () => {
          throw Error("storage failed");
        },
        {
          fetch: async () => {
            calls++;
            return response();
          },
        },
      ),
      /AI_USAGE_RECORD_FAILED/,
    );
    assert.equal(calls, 1);
  } finally {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
  }
});
