import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import {
  assignPortraits,
  PORTRAIT_IDS,
  portraitSource,
} from "../lib/agent-portraits";
import { PracticeClock, formatPracticeDuration } from "../lib/practice-clock";
import {
  practiceAgentStatus,
  practiceIsConnected,
} from "../lib/practice-state";
import type { Persona } from "../lib/types";

const audience: Persona[] = [
  {
    name: "Ece",
    background: "Business owner",
    behavior: "Asks for examples",
    gender: "female",
  },
  {
    name: "Selin",
    background: "New to the topic",
    behavior: "Checks assumptions",
    gender: "female",
  },
  {
    name: "Mert",
    background: "Experienced learner",
    behavior: "Asks about application",
    gender: "male",
  },
];

test("portrait identities survive reloads, voice edits and participant reordering", () => {
  const assigned = assignPortraits(audience, "session-one");
  assert.deepEqual(assigned, assignPortraits(audience, "session-one"));
  assert.equal(new Set(assigned.map((p) => p.portraitId)).size, 3);
  assert.deepEqual(
    audience.map((p) => p.portraitId),
    [undefined, undefined, undefined],
  );
  const edited = assigned
    .map((p) => ({ ...p, gender: "neutral" as const, voice: "alloy" as const }))
    .reverse();
  assert.deepEqual(
    assignPortraits(edited, "session-one").map((p) => p.portraitId),
    assigned.map((p) => p.portraitId).reverse(),
  );
});

test("all six local portraits are used before reuse and invalid IDs cannot become paths", () => {
  const personas = Array.from({ length: 7 }, (_, i) => ({
    ...audience[0],
    name: `Agent ${i}`,
    portraitId: "../../outside",
  }));
  const assigned = assignPortraits(personas, "session-two");
  assert.equal(new Set(assigned.slice(0, 6).map((p) => p.portraitId)).size, 6);
  for (const p of assigned) assert.ok(PORTRAIT_IDS.includes(p.portraitId!));
  assert.equal(
    portraitSource("https://other.example/portrait"),
    "/agents/portraits/portrait-01.webp",
  );
  for (const id of PORTRAIT_IDS)
    assert.ok(existsSync(`public${portraitSource(id)}`));
});

test("practice clock counts connected time, excludes preparation and feedback, and resumes without resetting", () => {
  const clock = new PracticeClock();
  assert.equal(clock.seconds(12_000), 0);
  clock.start(12_000);
  clock.start(13_000);
  assert.equal(clock.seconds(15_900), 3);
  assert.equal(clock.stop(16_500), 4);
  assert.equal(clock.seconds(60_000), 4);
  clock.start(60_000);
  assert.equal(clock.stop(62_500), 7);
  assert.equal(clock.stop(100_000), 7);
  clock.reset(125);
  assert.equal(clock.seconds(200_000), 125);
  clock.start(200_000);
  assert.equal(clock.stop(201_000), 126);
  clock.reset();
  assert.equal(clock.seconds(300_000), 0);
});

test("practice durations remain readable after an hour", () => {
  assert.equal(formatPracticeDuration(0), "00:00");
  assert.equal(formatPracticeDuration(125), "02:05");
  assert.equal(formatPracticeDuration(3602), "01:00:02");
});

test("agent states distinguish listening, waiting, preparing and speaking", () => {
  assert.equal(practiceAgentStatus("idle", 0, null), "Ready");
  assert.equal(practiceAgentStatus("listening", 0, null), "Listening");
  assert.equal(practiceAgentStatus("listening", 0, null, true), "Waiting");
  assert.equal(practiceAgentStatus("thinking", 0, null), "Thinking");
  assert.equal(practiceAgentStatus("rendering", 1, 1), "Preparing to speak");
  assert.equal(practiceAgentStatus("speaking", 1, 1), "Speaking");
  // Other agents must not claim to listen to the instructor while a turn plays.
  assert.equal(practiceAgentStatus("rendering", 0, 1), "Waiting");
  assert.equal(practiceAgentStatus("speaking", 0, 1), "Waiting");
});

test("disconnected and completed sessions cannot claim an active audio connection", () => {
  for (const state of [
    "idle",
    "connecting",
    "disconnected",
    "feedback",
    "ended",
  ] as const)
    assert.equal(practiceIsConnected(state), false);
  for (const state of [
    "listening",
    "thinking",
    "rendering",
    "speaking",
  ] as const)
    assert.equal(practiceIsConnected(state), true);
  assert.equal(practiceAgentStatus("connecting", 0, null), "Connecting…");
  assert.equal(practiceAgentStatus("disconnected", 0, null), "Offline");
  assert.equal(practiceAgentStatus("feedback", 0, 0), "Session ended");
  assert.equal(practiceAgentStatus("ended", 0, 0), "Session ended");
});
