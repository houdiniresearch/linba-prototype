import test from "node:test";
import assert from "node:assert/strict";
import { learningConversationReply } from "../lib/learning-conversation";
import type { structuredResponse } from "../lib/ai-runtime";
import type { Course, Question } from "../lib/types";

const course = {
  id: "presentation",
  name: "Müşteriyi Anlamak",
  pages: [
    {
      number: 2,
      title: "Görüşme",
      text: "Müşteriye geçmişte yaşadığı somut olayı sorun.",
    },
  ],
} as Course;
test("plain greetings and thanks are private conversational replies without model calls or citations", async () => {
  const noCall: typeof structuredResponse = async () => {
    throw Error("Unexpected model call");
  };
  for (const text of ["Merhabalar!", "Teşekkür ederim.", "Hello", "Thanks!"]) {
    const result = await learningConversationReply(
      course,
      text,
      [],
      "learner",
      noCall,
    );
    assert.equal(result?.conversationOnly, true);
    assert.ok(result?.answer);
  }
});
test("mixed greetings and relevant follow-ups continue to grounded answers; classification sees only this participant's history", async () => {
  const prior = [
    {
      courseId: "presentation",
      userId: "stranger",
      text: "FOREIGN_PRIVATE_MESSAGE",
    },
    {
      courseId: "other-course",
      userId: "learner",
      text: "FOREIGN_PRIVATE_MESSAGE",
    },
    {
      courseId: "presentation",
      userId: "learner",
      text: "Müşteri görüşmesi nasıl yapılır?",
      answer: "Somut olaylara odaklan.",
      sources: [2],
    },
  ] as Question[];
  const generate: typeof structuredResponse = async (
    task,
    schema,
    _prompt,
    input,
  ) => {
    assert.equal(task, "learning-route");
    assert.ok(!input.includes("FOREIGN_PRIVATE_MESSAGE"));
    assert.ok(input.includes("Müşteri görüşmesi"));
    return schema.parse({ intent: "presentation", language: "tr", reply: "" });
  };
  for (const text of [
    "Merhaba, müşteri görüşmesinde ne sormalıyım?",
    "Bir örnek verebilir misin?",
  ])
    assert.equal(
      await learningConversationReply(course, text, prior, "learner", generate),
      undefined,
    );
});
test("unrelated requests receive a role boundary instead of an instructor escalation; social chat can be natural", async () => {
  for (const intent of ["out_of_scope", "social"] as const) {
    const generate: typeof structuredResponse = async (_task, schema) =>
      schema.parse({
        intent,
        language: "tr",
        reply: intent === "social" ? "Buradayım, sunuma hazırız!" : "",
      });
    const result = await learningConversationReply(
      course,
      intent === "social" ? "Nasılsın?" : "Bana kek tarifi yaz",
      [],
      "learner",
      generate,
    );
    assert.equal(result?.conversationOnly, true);
    assert.ok(!result?.answer.includes("eğitmene"));
    if (intent === "out_of_scope")
      assert.match(result!.answer, /kapsamı dışında/u);
    else assert.equal(result!.answer, "Buradayım, sunuma hazırız!");
  }
  const unavailable: typeof structuredResponse = async () => {
    throw Error("timeout");
  };
  assert.match(
    (await learningConversationReply(
      course,
      "Hava nasıl?",
      [],
      "learner",
      unavailable,
    ))!.answer,
    /tekrar dener/u,
  );
});
