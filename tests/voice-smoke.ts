import { RTCPeerConnection } from "werift";
import assert from "node:assert/strict";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { get, all, remove, DATA_DIR } from "../lib/db";
import { VOICES, parsePersonaTurn } from "../lib/voices";
import { usageSummary } from "../lib/voice-usage";
import type { CourseState, Rehearsal } from "../lib/types";
import {
  feedbackRequest,
  participantCall,
  feedbackArguments,
} from "../lib/rehearsal-prompts";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
let cookie = "";
async function api(
  url: string,
  body?: unknown,
  method = body ? "POST" : "GET",
) {
  const r = await fetch(`${base}/api/${url}`, {
    method,
    headers: { "Content-Type": "application/json", cookie, Origin: base },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.headers.get("set-cookie"))
    cookie = r.headers.get("set-cookie")!.split(";")[0];
  if (!r.ok) throw new Error(`${url} HTTP ${r.status}: ${await r.text()}`);
  return r;
}
async function main() {
  let courseId = "",
    userId = "";
  const pc = new RTCPeerConnection({
    bundlePolicy: "max-bundle",
    iceServers: [],
  });
  try {
    const demo = await (await api("auth", { action: "demo" })).json();
    courseId = demo.course.id;
    userId = demo.user.id;
    const { rehearsal } = (await (
      await api(`courses/${courseId}/rehearsal`, {
        audience:
          "Dijital pazarlamayı yeni öğrenen kurgusal iki kadın ve bir erkek küçük işletme sahibi. Gerçek kişi isimleri kullanma.",
      })
    ).json()) as { rehearsal: Rehearsal };
    assert.ok(rehearsal.personas.some((p) => p.gender === "female"));
    assert.ok(rehearsal.personas.some((p) => p.gender === "male"));
    const voices =
      process.env.LINBA_TEST_ALL_VOICES === "1"
        ? VOICES
        : VOICES.filter((v) => v.id === "marin" || v.id === "cedar");
    await mkdir("output/voice-tests", { recursive: true });
    for (const voice of voices) {
      await api(
        `courses/${courseId}/rehearsal`,
        {
          id: rehearsal.id,
          action: "voice",
          personaIndex: 0,
          gender: voice.style,
          voice: voice.id,
        },
        "PATCH",
      );
      const r = await api(`courses/${courseId}/rehearsal-speech`, {
        rehearsalId: rehearsal.id,
        personaIndex: 0,
        text: "Merhaba. Bir örnek verir misiniz?",
      });
      const audio = Buffer.from(await r.arrayBuffer());
      assert.equal(audio.toString("ascii", 0, 4), "RIFF");
      assert.ok(audio.length > 1000);
      assert.equal(r.headers.get("X-Linba-Voice"), voice.id);
      assert.ok(
        JSON.parse(r.headers.get("X-Linba-Usage")!).usage.output_tokens > 0,
      );
      await writeFile(`output/voice-tests/${voice.id}.wav`, audio);
      console.log("Voice OK:", voice.id);
    }
    pc.addTransceiver("audio", { direction: "sendrecv" });
    const dc = pc.createDataChannel("oai-events");
    let text = "",
      phase = "turn";
    const jobs: Promise<unknown>[] = [];
    const done = new Promise<void>((resolve, reject) => {
      dc.onopen = () => {
        dc.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Bu otomatik bağlantı testinde gerçek mikrofon kullanılmıyor. Örnek ders anlatımı: Hedef kitle, ortak ihtiyaçları ve davranışları olan müşteri grubudur. ${rehearsal.personas[1].name}, sen kendi işletmende müşterilerinin nereden geldiğini soruyor musun?`,
                },
              ],
            },
          }),
        );
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: { output_modalities: ["text"], max_output_tokens: 500 },
          }),
        );
      };
      dc.onmessage = (event) => {
        void (async () => {
          try {
            const e = JSON.parse(event.data.toString());
            if (e.type === "error")
              throw new Error(`Realtime ${e.error?.code}: ${e.error?.message}`);
            if (
              e.type === "response.output_text.delta" ||
              e.type === "response.function_call_arguments.delta"
            )
              text += e.delta || "";
            if (e.type === "response.done") {
              if (e.response?.usage)
                jobs.push(
                  api(`courses/${courseId}/rehearsal-usage`, {
                    rehearsalId: rehearsal.id,
                    responseId: e.response.id,
                    usage: e.response.usage,
                  }),
                );
              if (phase === "turn") {
                const call = participantCall(e.response);
                dc.send(
                  JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                      type: "function_call_output",
                      call_id: call.call_id,
                      output: '{"received":true}',
                    },
                  }),
                );
                const turn = parsePersonaTurn(
                  call.arguments!,
                  rehearsal.personas.length,
                );
                assert.ok(turn);
                console.log("Coordinator persona:", turn.personaIndex);
                const r = await api(`courses/${courseId}/rehearsal-speech`, {
                  rehearsalId: rehearsal.id,
                  ...turn,
                });
                assert.ok((await r.arrayBuffer()).byteLength > 1000);
                phase = "feedback";
                text = "";
                dc.send(JSON.stringify(feedbackRequest()));
              } else {
                const feedback = JSON.parse(feedbackArguments(e.response));
                assert.ok(feedback.summary);
                await Promise.all(jobs);
                await api(
                  `courses/${courseId}/rehearsal`,
                  { id: rehearsal.id, remarks: [], feedback },
                  "PATCH",
                );
                resolve();
              }
            }
          } catch (e) {
            reject(e);
          }
        })();
      };
    });
    let watchdog: ReturnType<typeof setTimeout>;
    const timedOut = new Promise<never>((_, reject) => {
      watchdog = setTimeout(() => {
        void pc.close();
        reject(new Error("WebRTC test timeout"));
      }, 60000);
    });
    try {
      await pc.setLocalDescription(await pc.createOffer());
      const sdp = await (
        await api(`courses/${courseId}/voice`, {
          rehearsalId: rehearsal.id,
          sdp: pc.localDescription!.sdp,
        })
      ).text();
      await pc.setRemoteDescription({ type: "answer", sdp });
      await Promise.race([done, timedOut]);
      const state = (await (
        await api(`courses/${courseId}`)
      ).json()) as CourseState;
      const saved = state.rehearsals.find((r) => r.id === rehearsal.id)!;
      assert.ok(
        saved.usage!.filter((e) => e.stage === "conversation").length >= 2,
      );
      assert.ok(saved.feedback);
      const usage = usageSummary(saved.usage!);
      assert.ok(usage.known);
      assert.ok(usage.extra > 0);
      const report = {
        passed: true,
        voices: voices.map((v) => v.id),
        microphoneUsed: false,
        usage,
        entries: saved.usage,
      };
      await writeFile(
        "output/voice-tests/usage.json",
        JSON.stringify(report, null, 2),
      );
      console.log(
        JSON.stringify({
          passed: true,
          voices: voices.length,
          microphoneUsed: false,
          usage,
        }),
      );
    } finally {
      clearTimeout(watchdog!);
    }
  } finally {
    await pc.close();
    if (courseId) {
      for (const r of all<Rehearsal>("rehearsal").filter(
        (r) => r.courseId === courseId,
      ))
        remove("rehearsal", r.id);
      remove("course", courseId);
      await rm(`${DATA_DIR}/files/${courseId}`, {
        recursive: true,
        force: true,
      });
    }
    if (userId) {
      for (const s of all<{ id: string; userId: string }>("session").filter(
        (s) => s.userId === userId,
      ))
        remove("session", s.id);
      remove("user", userId);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
