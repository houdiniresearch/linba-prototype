import test from "node:test";
import assert from "node:assert/strict";
import { canChat, validateSlideOrder } from "../lib/courses";
import { retrieve } from "../lib/ai";
import { hasDuplicateOptions, pollResults } from "../lib/activities";
import { joinOrigin, localAddresses } from "../lib/network";
import type { Course } from "../lib/types";
import {
  assignVoices,
  parsePersonaTurn,
  VOICES,
  personaVoice,
} from "../lib/voices";
import {
  appendUsage,
  usageCost,
  usageSummary,
  type UsageEntry,
} from "../lib/voice-usage";
import { pcmWav } from "../lib/persona-speech";
test("fictional personas get matching distinct voices and legacy personas stay neutral", () => {
  const base = { name: "Kurgusal kişi", background: "", behavior: "" };
  const list = assignVoices([
    { ...base, gender: "female" },
    { ...base, gender: "male" },
    { ...base, gender: "female" },
    { ...base, gender: "female", voice: "cedar" },
    base,
  ]);
  assert.equal(list[0].voice, "marin");
  assert.equal(list[1].voice, "cedar");
  assert.equal(list[2].voice, "coral");
  assert.notEqual(list[3].voice, "cedar");
  assert.equal(personaVoice(base), "alloy");
  assert.equal(new Set(VOICES.map((v) => v.id)).size, 10);
});
test("persona routing rejects missing or out of range speaker identity", () => {
  assert.deepEqual(
    parsePersonaTurn(
      '{"speak":true,"personaIndex":1,"text":"Bir örnek verir misiniz?"}',
      3,
    ),
    { personaIndex: 1, text: "Bir örnek verir misiniz?" },
  );
  assert.equal(parsePersonaTurn('{"speak":false}', 3), null);
  for (const raw of [
    "{}",
    '{"personaIndex":3,"text":"a"}',
    '{"personaIndex":-1,"text":"a"}',
    '{"personaIndex":0,"text":" "}',
  ])
    assert.throws(() => parsePersonaTurn(raw, 3));
});
test("cached tokens are priced once and duplicate usage events do not inflate estimates", () => {
  const entry: UsageEntry = {
    id: "resp_test",
    stage: "speech",
    model: "gpt-realtime-2.1-mini",
    usage: {
      input_tokens: 1000,
      output_tokens: 300,
      input_token_details: {
        text_tokens: 400,
        audio_tokens: 600,
        cached_tokens: 300,
        cached_tokens_details: { text_tokens: 100, audio_tokens: 200 },
      },
      output_token_details: { text_tokens: 100, audio_tokens: 200 },
    },
  };
  assert.ok(Math.abs(usageCost(entry)! - 0.008486) < 1e-10);
  const entries = appendUsage(appendUsage([], entry), entry);
  assert.equal(entries.length, 1);
  assert.equal(usageSummary(entries).extra, usageSummary(entries).total);
  assert.equal(usageCost({ ...entry, model: "unknown-model" }), null);
  assert.equal(
    usageCost({ ...entry, usage: { input_tokens: 1, output_tokens: 1 } }),
    null,
  );
});
test("speech PCM is delivered as mono 24kHz 16-bit WAV", () => {
  const pcm = Buffer.alloc(480),
    wav = pcmWav(pcm);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.equal(wav.length, pcm.length + 44);
});
test("legacy duplicate poll labels do not duplicate response counts in reports", () => {
  const rows = pollResults(
    ["test", "test", "diğer"],
    [{ value: "test" }, { value: "test" }, { value: "diğer" }],
  );
  assert.equal(rows.length, 2);
  assert.equal(
    rows.reduce((total, row) => total + row.count, 0),
    3,
  );
  assert.equal(rows[0].count, 2);
  assert.equal(rows[0].percentage, (2 / 3) * 100);
});
test("duplicate poll labels are detected after whitespace and Turkish case normalization", () => {
  assert.equal(hasDuplicateOptions(["test", " test "]), true);
  assert.equal(hasDuplicateOptions(["İstanbul", "istanbul"]), true);
  assert.equal(hasDuplicateOptions(["Ankara", "İstanbul"]), false);
});
test("projected join address uses the LAN host and preserves the port", () => {
  const origin = new URL(
    joinOrigin(
      new Request("http://0.0.0.0:3000/api/presentation", {
        headers: { host: "localhost:3000" },
      }),
    ),
  );
  assert.equal(origin.port, "3000");
  assert.equal(origin.hostname, localAddresses()[0] || "localhost");
  assert.equal(
    joinOrigin(
      new Request("https://linba.example/api/presentation", {
        headers: { host: "linba.example" },
      }),
    ),
    "https://linba.example",
  );
});
const course = {
  status: "ended",
  accessDays: 7,
  endedAt: "2026-10-13T10:00:00.000Z",
  slides: [
    { id: "a", kind: "document" },
    { id: "x", kind: "activity" },
    { id: "b", kind: "document" },
  ],
} as Course;
test("access starts at end and expires at the exact boundary", () => {
  const end = Date.parse(course.endedAt!);
  assert.equal(canChat(course, end - 1), true);
  assert.equal(canChat(course, end + 7 * 86400000 - 1), true);
  assert.equal(canChat(course, end + 7 * 86400000), false);
  assert.equal(canChat({ ...course, accessDays: 0 }, end), false);
  assert.equal(canChat({ ...course, status: "draft" }, end), false);
});
test("activity can move, document order and permutation integrity remain protected", () => {
  validateSlideOrder(course, ["x", "a", "b"]);
  validateSlideOrder(course, ["a", "b", "x"]);
  assert.throws(() => validateSlideOrder(course, ["b", "x", "a"]));
  assert.throws(() => validateSlideOrder(course, ["a", "a", "b"]));
  assert.throws(() => validateSlideOrder(course, ["a", "b"]));
});
test("retrieval excludes unrelated material and retains original page citations", () => {
  const pages = [
    {
      id: "1",
      number: 4,
      title: "Kanal",
      text: "Kanal seçimi hedef kitlenin davranışlarına dayanır.",
      image: "",
      ratio: 1,
    },
    {
      id: "2",
      number: 9,
      title: "Bütçe",
      text: "Başlangıç bütçesi test amacıyla sınırlandırılır.",
      image: "",
      ratio: 1,
    },
  ];
  assert.equal(retrieve(pages, "Kanal seçimi nasıl yapılır?")[0].number, 4);
  assert.deepEqual(retrieve(pages, "Kuantum fiziği"), []);
});
