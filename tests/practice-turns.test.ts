import test from "node:test";
import assert from "node:assert/strict";
import {
  PRACTICE_GREETING,
  practiceTurnIsConcise,
  shouldGreetPractice,
} from "../lib/practice-quality";
import { parsePersonaTurn } from "../lib/voices";
import { participantLineValid } from "../lib/participant-quality";
import { roleRepairRequest } from "../lib/rehearsal-prompts";

test("only a fresh practice opens with one short greeting; reconnect and reload do not repeat it", async () => {
  const seen = new Set<string>();
  assert(shouldGreetPractice({ id: "first" }, seen));
  seen.add("first");
  assert(!shouldGreetPractice({ id: "first" }, seen));
  assert(
    !shouldGreetPractice(
      { id: "first", voiceExpiresAt: new Date().toISOString() },
      new Set(),
    ),
  );
  assert(shouldGreetPractice({ id: "second" }, seen));
  assert(practiceTurnIsConcise(PRACTICE_GREETING));
  assert.equal(
    await participantLineValid(
      { name: "Ece", background: "", behavior: "" },
      PRACTICE_GREETING,
      undefined,
      async () => {
        throw Error("A fixed greeting must not need a model decision");
      },
    ),
    true,
  );
});
test("questions stay within 18 words and one question; other contributions stay within 24 words", () => {
  const words = (count: number) => Array(count).fill("kelime").join(" ");
  assert(practiceTurnIsConcise(words(18) + "?"));
  assert(!practiceTurnIsConcise(words(19) + "?"));
  assert(practiceTurnIsConcise(words(24) + "."));
  assert(!practiceTurnIsConcise(words(25) + "."));
  assert(!practiceTurnIsConcise("Nasıl hesaplarım? Nereden başlarım?"));
  assert(!practiceTurnIsConcise("a".repeat(321)));
  assert.throws(
    () =>
      parsePersonaTurn(
        JSON.stringify({ speak: true, personaIndex: 0, text: words(19) + "?" }),
        3,
      ),
    /PARTICIPANT_TURN_TOO_LONG/,
  );
  assert.equal(
    parsePersonaTurn(
      JSON.stringify({
        speak: true,
        personaIndex: 0,
        text: "Müşterinin gerçekten bu sorunu yaşadığını nasıl anlayabilirim?",
      }),
      3,
    )?.personaIndex,
    0,
  );
  assert(
    roleRepairRequest(
      "İşletme sahipleri",
      [],
      "length",
    ).response.instructions.includes("en fazla 18 kelime"),
  );
});
