import test from "node:test";
import assert from "node:assert/strict";
import {
  PracticeTurnTaking,
  practiceTurnDetection,
} from "../lib/practice-turn-taking";

function session() {
  const track = { enabled: true },
    events: string[] = [];
  const turns = new PracticeTurnTaking({
    microphone(enabled) {
      track.enabled = enabled;
      events.push(`mic:${enabled}`);
    },
    automaticResponses(enabled) {
      events.push(`responses:${enabled}`);
    },
    clearInput() {
      events.push("clear");
    },
  });
  return { track, events, turns };
}
test("greeting, answer rendering and playback hold the microphone until the agent finishes", () => {
  const { track, turns, events } = session();
  turns.start();
  assert.equal(
    track.enabled,
    false,
    "opening greeting must not pick up room noise",
  );
  assert.equal(turns.acceptsSpeech, false);
  turns.listen();
  assert.equal(track.enabled, true);
  turns.hold(); // response.created
  turns.hold(); // separate audio rendering starts after response.done
  assert.equal(
    track.enabled,
    false,
    "text completion must not resume the microphone before audio playback",
  );
  assert.equal(
    turns.acceptsSpeech,
    false,
    "late speech_started must be ignored",
  );
  events.length = 0;
  turns.listen(); // audio.onended / recoverable playback failure
  assert.deepEqual(events, ["clear", "responses:true", "mic:true"]);
  assert.equal(turns.acceptsSpeech, true);
  assert.equal(practiceTurnDetection().interrupt_response, false);
  assert.equal(practiceTurnDetection(false).create_response, false);
});
test("manual unmute cannot open the microphone during agent speech; manual mute survives the handoff", () => {
  const { turns, track } = session();
  turns.start();
  turns.listen();
  turns.hold();
  turns.setMuted(true);
  turns.setMuted(false);
  assert.equal(track.enabled, false);
  turns.setMuted(true);
  turns.listen();
  assert.equal(track.enabled, false);
  assert.equal(turns.muted, true);
  turns.setMuted(false);
  assert.equal(track.enabled, true);
});
test("finish or disconnection wins over delayed audio callbacks, and reconnect starts with a closed microphone", () => {
  const { turns, track, events } = session();
  turns.start();
  turns.hold();
  turns.stop();
  events.length = 0;
  turns.listen(); // stale onended after close
  assert.equal(track.enabled, false);
  assert.deepEqual(events, []);
  turns.setMuted(false);
  assert.equal(track.enabled, false);
  turns.start();
  assert.equal(track.enabled, false);
  turns.listen();
  assert.equal(track.enabled, true);
});
