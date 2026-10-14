import WebSocket from "ws";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { personaSpeech } from "../lib/persona-speech";
import { modelName } from "../lib/ai";
import {
  buildRehearsalInstructions,
  participantTools,
  participantCall,
} from "../lib/rehearsal-prompts";
import { parsePersonaTurn } from "../lib/voices";
import { appendUsage, usageSummary, type UsageEntry } from "../lib/voice-usage";
const personas = [
  {
    name: "Ayşe",
    background: "Takı dükkânı işletiyor.",
    behavior: "Kendi işinden örnek verir.",
  },
  {
    name: "Mehmet",
    background: "Bisiklet tamir atölyesi işletiyor.",
    behavior: "Somut sorulara kendi işi üzerinden cevap verir.",
  },
  {
    name: "Selin",
    background:
      "Online dil atölyeleri düzenliyor. E-posta listesi var; kayıtların kaynağını izlemiyor.",
    behavior: "Kendi işindeki belirsizliği kısa bir cevapla ifade eder.",
  },
];
async function main() {
  let usage: UsageEntry[] = [];
  const teacher =
    "Selin, e-posta listesi kullandığını söyledin. Atölyeye kayıt olanların seni nereden duyduğunu düzenli soruyor musun?";
  const wav = await personaSpeech(teacher, "marin", (id, tokens) => {
    usage = appendUsage(usage, {
      id,
      model: modelName(),
      stage: "preview",
      usage: tokens,
    });
  });
  const socket = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(modelName())}`,
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
  );
  const result = await new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Audio input test timeout"));
    }, 45000);
    const fail = (e: Error) => {
      clearTimeout(timer);
      socket.close();
      reject(e);
    };
    socket.on("error", fail);
    socket.on("message", (buffer) => {
      try {
        const e = JSON.parse(buffer.toString());
        if (e.type === "session.created")
          socket.send(
            JSON.stringify({
              type: "session.update",
              session: {
                type: "realtime",
                output_modalities: ["text"],
                instructions: buildRehearsalInstructions(
                  "Dijital pazarlamaya yeni başlayan küçük işletme sahipleri.",
                  personas,
                ),
                ...participantTools(personas.length),
                audio: {
                  input: {
                    format: { type: "audio/pcm", rate: 24000 },
                    turn_detection: null,
                  },
                },
              },
            }),
          );
        if (e.type === "session.updated") {
          socket.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [
                  {
                    type: "input_audio",
                    audio: wav.subarray(44).toString("base64"),
                  },
                ],
              },
            }),
          );
          socket.send(
            JSON.stringify({
              type: "response.create",
              response: { output_modalities: ["text"], max_output_tokens: 700 },
            }),
          );
        }
        if (e.type === "error")
          fail(new Error(`${e.error?.code}: ${e.error?.message}`));
        if (e.type === "response.done") {
          if (e.response?.usage)
            usage = appendUsage(usage, {
              id: e.response.id,
              model: modelName(),
              stage: "conversation",
              usage: e.response.usage,
            });
          const call = participantCall(e.response);
          const turn = parsePersonaTurn(call.arguments!, personas.length);
          assert.ok(turn);
          assert.equal(turn.personaIndex, 2);
          clearTimeout(timer);
          socket.close();
          resolve(turn);
        }
      } catch (e) {
        fail(e as Error);
      }
    });
  });
  const report = {
    passed: true,
    input: "synthetic Turkish audio",
    microphoneUsed: false,
    teacher,
    result,
    usage: usageSummary(usage),
  };
  await mkdir("output/voice-tests", { recursive: true });
  await writeFile(
    "output/voice-tests/audio-input-eval.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
