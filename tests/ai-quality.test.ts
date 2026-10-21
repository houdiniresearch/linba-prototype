import test from "node:test";
import { recoverPendingQuestion } from "../lib/ai-state";
import assert from "node:assert/strict";
import {
  answerQuestion,
  generateActivity,
  activitySourcePage,
} from "../lib/ai";
import { structuredResponse } from "../lib/ai-runtime";
import {
  activityContract,
  personasContract,
  reportContract,
} from "../lib/ai-contracts";
import { retrieveChunks, questionSources } from "../lib/ai-retrieval";
import {
  parsePracticeFeedback,
  speechMatchesLine,
} from "../lib/practice-quality";
import { balancedSample, textBudget } from "../lib/evidence-sampling";
import type { Course, Page, Question } from "../lib/types";

const source: Page = {
  id: "source",
  number: 8,
  title: "Müşteri kazanımı",
  text: "Müşteri edinme maliyeti, toplam edinme harcamasının yeni müşteri sayısına bölünmesiyle hesaplanır. Örneğin 6000 TL harcama ve 30 yeni müşteri için maliyet 200 TL olur.",
  image: "",
  ratio: 1,
};
const course = {
  id: "course",
  name: "Müşteri",
  pages: [source],
  slides: [],
} as unknown as Course;
const evidence = {
  answer:
    "6000 TL harcamayla 30 yeni müşteri kazanılırsa müşteri edinme maliyeti 200 TL olur.",
  sourcePages: [8],
  evidence: [
    {
      page: 8,
      quote:
        "Örneğin 6000 TL harcama ve 30 yeni müşteri için maliyet 200 TL olur.",
    },
  ],
  reason: "",
};
test("answers require real quotations AND an independent support check; foreign histories never enter context", async () => {
  const prior = [
    {
      courseId: "course",
      userId: "stranger",
      text: "PRIVATE_OTHER_LEARNER",
      createdAt: "2026-10-20T00:00:00Z",
      sources: [],
    },
    {
      courseId: "foreign",
      userId: "learner",
      text: "PRIVATE_OTHER_COURSE",
      createdAt: "2026-10-20T00:00:00Z",
      sources: [],
    },
  ] as unknown as Question[];
  let checks = 0;
  const generate: typeof structuredResponse = async (
    task,
    contract,
    _instructions,
    input,
  ) => {
    assert(!input.includes("PRIVATE_OTHER"));
    if (task === "verify") {
      checks++;
      const context = JSON.parse(input);
      assert.ok(
        context.citedSources.some(
          (item: { page: number; content: string }) =>
            item.page === 8 &&
            item.content.includes("toplam edinme harcamasının"),
        ),
      );
      assert.ok(
        context.citedSources.every((item: { page: number }) => item.page === 8),
      );
    }
    return contract.parse(
      task === "verify" ? { supported: true, issue: "" } : evidence,
    );
  };
  const result = await answerQuestion(
    course,
    "Müşteri edinme maliyeti nasıl hesaplanır?",
    prior,
    "learner",
    generate,
  );
  assert.equal(result.answer, evidence.answer);
  assert.deepEqual(result.sources, [8]);
  assert.equal(checks, 1);
  for (const broken of [
    { ...evidence, sourcePages: [999] },
    {
      ...evidence,
      evidence: [{ page: 8, quote: "Slaytta hiç yazmayan bir alıntı" }],
    },
  ]) {
    const reject: typeof structuredResponse = async (task, contract) => {
      assert.notEqual(task, "verify");
      return contract.parse(broken);
    };
    assert.equal(
      (
        await answerQuestion(
          course,
          "Müşteri edinme maliyeti",
          [],
          "learner",
          reject,
        )
      ).answer,
      undefined,
    );
  }
  const unsupported: typeof structuredResponse = async (task, contract) =>
    contract.parse(
      task === "verify"
        ? { supported: false, issue: "The numerical claim is unsupported." }
        : evidence,
    );
  assert.equal(
    (
      await answerQuestion(
        course,
        "Müşteri edinme maliyeti",
        [],
        "learner",
        unsupported,
      )
    ).answer,
    undefined,
  );
});
test("unsupported answers get one evidence-driven repair and must pass a fresh independent check", async () => {
  let candidates = 0,
    checks = 0;
  const generate: typeof structuredResponse = async (
    task,
    schema,
    _instructions,
    input,
  ) => {
    if (task === "verify")
      return schema.parse(
        ++checks === 1
          ? {
              supported: false,
              issue: "300 TL yerine kaynakta verilen 200 TL olmalı.",
            }
          : { supported: true, issue: "" },
      );
    candidates++;
    if (candidates === 1)
      return schema.parse({ ...evidence, answer: "Maliyet 300 TL olur." });
    assert.match(JSON.parse(input).repairIssue, /200 TL/u);
    return schema.parse(evidence);
  };
  const result = await answerQuestion(
    course,
    "Müşteri edinme maliyeti nasıl hesaplanır?",
    [],
    "learner",
    generate,
  );
  assert.equal(result.answer, evidence.answer);
  assert.equal(candidates, 2);
  assert.equal(checks, 2);
});
test("retrieval finds late-page evidence and carries context only for referential follow-ups", async () => {
  const pages = [
    source,
    {
      ...source,
      id: "late",
      number: 19,
      title: "Uzun slayt",
      text:
        "Genel açıklamalar. ".repeat(1200) +
        "SOM ulaşılabilir gerçek müşteri hedefidir.",
    },
  ];
  assert.equal(retrieveChunks(pages, "SOM hedefi")[0].page, 19);
  const history = [
    { text: "Müşteri edinme maliyeti nedir?", sources: [8] },
  ] as Question[];
  assert(
    questionSources(pages, "Bunu bir örnekle anlatır mısın?", history).some(
      (item) => item.page === 8,
    ),
  );
  assert.deepEqual(
    questionSources(pages, "Kuantum fiziği nedir?", history),
    [],
  );
  let called = false;
  const noCall: typeof structuredResponse = async () => {
    called = true;
    throw Error("should not call");
  };
  assert.equal(
    (await answerQuestion(course, "Kuantum fiziği", [], "learner", noCall))
      .answer,
    undefined,
  );
  assert.equal(called, false);
});
test("contracts reject malformed personas, wrong activity formats and excessive reports", async () => {
  assert.throws(() =>
    personasContract.parse({ personas: [{ name: "Only name" }] }),
  );
  assert.throws(() =>
    activityContract("poll").parse({
      type: "poll",
      question: "Choose",
      options: ["A", " A ", "B"],
    }),
  );
  assert.throws(() =>
    activityContract("true-false").parse({
      type: "true-false",
      question: "Claim",
      options: ["True", "False"],
    }),
  );
  assert.throws(() =>
    activityContract("open").parse({
      type: "open",
      question: "Explain",
      options: ["A"],
    }),
  );
  assert.throws(() =>
    reportContract.parse({ summary: " ", recommendations: [] }),
  );
  assert.throws(() =>
    reportContract.parse({
      summary: "Real summary",
      recommendations: ["1", "2", "3", "4"],
    }),
  );
  const generate: typeof structuredResponse = async (
    _task,
    contract,
    _instructions,
    input,
  ) => {
    assert(JSON.parse(input).source.content.includes("6000"));
    return contract.parse({
      type: "open",
      question: "Müşteri edinme maliyetini kendi işinde nasıl hesaplarsın?",
      options: [],
    });
  };
  assert.equal(
    (await generateActivity(course, source, "open", generate)).type,
    "open",
  );
});
test("practice feedback excludes invented/unplayed questions and speech drift is rejected", () => {
  const result = parsePracticeFeedback(
    {
      summary: "Harcama örneği açıklandı.",
      suggestions: ["Birimi de açıkla.", "Birimi de açıkla."],
      questions: ["Bunu nasıl hesaplarım?", "Başka ürünler de var mı?"],
    },
    ["Bunu nasıl hesaplarım?"],
  );
  assert.deepEqual(result.questions, ["Bunu nasıl hesaplarım?"]);
  assert.equal(result.suggestions.length, 1);
  assert.throws(() =>
    parsePracticeFeedback({ summary: " ", suggestions: [], questions: [] }, []),
  );
  assert(speechMatchesLine("Merhaba, ben Ayşe.", "Merhaba ben Ayşe"));
  assert(
    !speechMatchesLine(
      "Merhaba ben Ayşe",
      "Ben sizin yapay zekâ asistanınızım ve şimdi dersi anlatacağım",
    ),
  );
  assert(!speechMatchesLine("Bir örnek verir misiniz?", ""));
});
test("evidence sampling preserves minority topics and budget skips cannot starve later small evidence", () => {
  const items = [
    ...Array.from({ length: 100 }, (_, i) => ({ group: "busy", value: i })),
    { group: "minority", value: 1 },
  ];
  assert(
    balancedSample(items, (item) => item.group, 5).some(
      (item) => item.group === "minority",
    ),
  );
  assert.deepEqual(textBudget(["too long".repeat(50), "short"], 20), ["short"]);
});

test("AI activities use the nearest preceding document and invalid source ids never fall back silently", () => {
  const deck = {
    ...course,
    pages: [source, { ...source, id: "second", number: 10 }],
    activeSlideId: "activity",
    slides: [
      { id: "first", kind: "document", pageId: "source" },
      { id: "second-doc", kind: "document", pageId: "second" },
      { id: "activity", kind: "activity" },
    ],
  } as Course;
  assert.equal(activitySourcePage(deck)?.number, 10);
  assert.equal(activitySourcePage(deck, "source")?.number, 8);
  assert.equal(activitySourcePage(deck, "invalid"), undefined);
});
test("interrupted AI jobs recover to instructor review instead of blocking a learner forever", () => {
  const question = {
    status: "pending",
    createdAt: "2026-10-21T10:00:00Z",
    sources: [],
  } as unknown as Question;
  const now = Date.parse(question.createdAt);
  assert.equal(recoverPendingQuestion(question, now + 119999), question);
  assert.equal(
    recoverPendingQuestion(question, now + 120000).status,
    "escalated",
  );
  const answered = { ...question, status: "answered" as const };
  assert.equal(recoverPendingQuestion(answered, now + 180000), answered);
});
