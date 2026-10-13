import test from "node:test";
import assert from "node:assert/strict";
import { canChat, validateSlideOrder } from "../lib/courses";
import { retrieve } from "../lib/ai";
import { joinOrigin, localAddresses } from "../lib/network";
import type { Course } from "../lib/types";
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
