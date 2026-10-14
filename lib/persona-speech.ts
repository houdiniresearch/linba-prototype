import WebSocket from "ws";
import { aiReady, modelName, type UsageCallback } from "./ai";
import type { VoiceId } from "./voices";
import {
  SPEECH_RENDER_PROMPT,
  isParticipantRoleLeak,
} from "./rehearsal-prompts";

export function pcmWav(pcm: Buffer) {
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(48000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
export async function personaSpeech(
  text: string,
  voice: VoiceId,
  onUsage: UsageCallback,
) {
  if (!aiReady()) throw new Error("AI_NOT_CONFIGURED");
  if (isParticipantRoleLeak(text)) throw new Error("PARTICIPANT_ROLE_LEAK");
  return new Promise<Buffer>((resolve, reject) => {
    const socket = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(modelName())}`,
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
    );
    const chunks: Buffer[] = [];
    let transcript = "";
    let settled = false,
      started = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      error ? reject(error) : resolve(pcmWav(Buffer.concat(chunks)));
    };
    const timer = setTimeout(() => finish(new Error("SPEECH_TIMEOUT")), 45000);
    const instructions = SPEECH_RENDER_PROMPT;
    socket.on("message", (buffer) => {
      try {
        const event = JSON.parse(buffer.toString());
        if (event.type === "session.created")
          socket.send(
            JSON.stringify({
              type: "session.update",
              session: {
                type: "realtime",
                instructions,
                output_modalities: ["audio"],
                audio: {
                  output: { voice, format: { type: "audio/pcm", rate: 24000 } },
                },
              },
            }),
          );
        if (event.type === "session.updated" && !started) {
          started = true;
          socket.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: JSON.stringify({ replik: text }),
                  },
                ],
              },
            }),
          );
          socket.send(
            JSON.stringify({
              type: "response.create",
              response: {
                output_modalities: ["audio"],
                max_output_tokens: 1500,
              },
            }),
          );
        }
        if (event.type === "response.output_audio.delta")
          chunks.push(Buffer.from(event.delta, "base64"));
        if (event.type === "response.output_audio_transcript.delta")
          transcript += event.delta || "";
        if (event.type === "response.done") {
          if (event.response?.usage)
            onUsage(event.response.id, event.response.usage);
          finish(
            event.response?.status !== "completed" ||
              !chunks.length ||
              isParticipantRoleLeak(transcript)
              ? new Error("SPEECH_FAILED")
              : undefined,
          );
        }
        if (event.type === "error") finish(new Error("SPEECH_PROVIDER_ERROR"));
      } catch {
        finish(new Error("SPEECH_INVALID_RESPONSE"));
      }
    });
    socket.on("error", () => finish(new Error("SPEECH_CONNECTION_FAILED")));
    socket.on("close", () => {
      if (!settled) finish(new Error("SPEECH_CONNECTION_CLOSED"));
    });
  });
}
