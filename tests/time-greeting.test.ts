import assert from "node:assert/strict";
import test from "node:test";
import { timeGreeting } from "../lib/time-greeting";
import { translate } from "../lib/translations";

test("local-hour greetings change at the morning, daytime, evening and night boundaries", () => {
  for (const [hour, expected] of [
    [0, "Good night"],
    [4, "Good night"],
    [5, "Good morning"],
    [9, "Good morning"],
    [10, "Hello"],
    [12, "Hello"],
    [16, "Hello"],
    [17, "Good evening"],
    [21, "Good evening"],
    [22, "Good night"],
    [23, "Good night"],
  ] as const)
    assert.equal(timeGreeting(hour), expected);
  assert.equal(translate(timeGreeting(8), "tr"), "Günaydın");
  assert.equal(translate(timeGreeting(13), "tr"), "Merhaba");
  assert.equal(translate(timeGreeting(19), "tr"), "İyi akşamlar");
  assert.equal(translate(timeGreeting(23), "tr"), "İyi geceler");
});
