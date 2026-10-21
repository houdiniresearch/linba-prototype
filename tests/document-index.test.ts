import test from "node:test";
import assert from "node:assert/strict";
import {
  documentChunks,
  documentHash,
  embedTexts,
} from "../lib/document-index";
import type { Page } from "../lib/types";
const page = (text: string, number = 1): Page => ({
  id: `page-${number}`,
  number,
  title: `Source ${number}`,
  text,
  image: `${number}.png`,
  ratio: 1.7,
});
test("chunks retain original source pages, overlap without gaps, and skip empty image-only pages", () => {
  const text = Array.from({ length: 900 }, (_, index) => `word${index}`).join(
    " ",
  );
  const chunks = documentChunks([page(""), page(text, 8)]);
  assert.ok(chunks.length > 1);
  assert.ok(
    chunks.every((item) => item.page === 8 && item.content.length <= 2400),
  );
  for (let i = 0; i < 900; i++)
    assert.ok(chunks.some((chunk) => chunk.content.includes(`word${i}`)));
  assert.deepEqual(
    chunks.map((chunk) => chunk.index),
    chunks.map((_, index) => index),
  );
  assert.equal(documentHash([page(text)]), documentHash([page(text)]));
  assert.notEqual(
    documentHash([page(text)]),
    documentHash([page(text + " changed")]),
  );
});
test("embedding responses must cover every input in order with exactly 1536 finite dimensions", async () => {
  const original = globalThis.fetch,
    previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "fixture-not-a-real-key";
  try {
    const vector = Array(1536).fill(0.1);
    globalThis.fetch = async () =>
      Response.json({
        data: [
          { index: 1, embedding: vector.map(() => 0.2) },
          { index: 0, embedding: vector },
        ],
      });
    const result = await embedTexts(["first", "second"]);
    assert.equal(result[0][0], 0.1);
    assert.equal(result[1][0], 0.2);
    globalThis.fetch = async () =>
      Response.json({ data: [{ index: 0, embedding: [0.1] }] });
    await assert.rejects(embedTexts(["first"]), /INVALID_EMBEDDING/);
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
