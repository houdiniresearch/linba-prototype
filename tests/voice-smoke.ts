import { RTCPeerConnection } from "werift";
import assert from "node:assert/strict";
const base = process.env.LINBA_TEST_URL || "http://localhost:3000";
let cookie = "";
async function api(url: string, body: unknown, method = "POST") {
  const r = await fetch(`${base}/api/${url}`, {
    method,
    headers: { "Content-Type": "application/json", cookie, Origin: base },
    body: JSON.stringify(body),
  });
  if (r.headers.get("set-cookie"))
    cookie = r.headers.get("set-cookie")!.split(";")[0];
  if (!r.ok) throw new Error(`${url} HTTP ${r.status}: ${await r.text()}`);
  return r;
}
async function main() {
  const { course } = await (await api("auth", { action: "demo" })).json();
  const { rehearsal } = await (
    await api(`courses/${course.id}/rehearsal`, {
      audience:
        "Dijital pazarlamayı yeni öğrenen küçük işletme sahipleri. Kaynaklarını dikkatli kullanmak istiyorlar.",
    })
  ).json();
  const pc = new RTCPeerConnection({
    bundlePolicy: "max-bundle",
    iceServers: [],
  });
  pc.addTransceiver("audio", { direction: "sendrecv" });
  const dc = pc.createDataChannel("oai-events");
  let packets = 0,
    transcript = "",
    text = "",
    phase = "audio";
  pc.onTrack.subscribe((track) =>
    track.onReceiveRtp.subscribe(() => packets++),
  );
  const watchdog = setTimeout(() => {
    void pc.close();
    console.error("WebRTC test timeout");
    process.exitCode = 1;
  }, 55000);
  try {
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
                  text: "Bu bir otomatik bağlantı testidir. Gerçek mikrofon kullanılmıyor. Örnek eğitmen anlatımı: Hedef kitle ortak ihtiyaç ve davranışları bulunan müşteri kesimidir. Persona bu kesimin araştırmaya dayalı temsilidir. Bir katılımcı gibi tek kısa soru sor.",
                },
              ],
            },
          }),
        );
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: { output_modalities: ["audio"], max_output_tokens: 250 },
          }),
        );
      };
      dc.onmessage = (event) => {
        const e = JSON.parse(event.data.toString());
        if (e.type === "error")
          reject(new Error(`Realtime ${e.error?.code}: ${e.error?.message}`));
        if (e.type === "response.output_audio_transcript.delta")
          transcript += e.delta || "";
        if (e.type === "response.output_text.delta") text += e.delta || "";
        if (e.type === "response.done") {
          if (phase === "audio") {
            assert.ok(transcript);
            phase = "feedback";
            dc.send(
              JSON.stringify({
                type: "response.create",
                response: {
                  output_modalities: ["text"],
                  max_output_tokens: 700,
                  instructions:
                    'Otomatik prova testini değerlendir. Gerçek sesli anlatım olmadığını belirt. Yalnız JSON: {"summary":"kısa özet","suggestions":[],"questions":["gerçek sorduğun soru"]}.',
                },
              }),
            );
          } else resolve();
        }
      };
    });
    await pc.setLocalDescription(await pc.createOffer());
    const response = await api(`courses/${course.id}/voice`, {
      rehearsalId: rehearsal.id,
      sdp: pc.localDescription!.sdp,
    });
    const sdp = await response.text();
    assert.ok(sdp.startsWith("v=0"));
    await pc.setRemoteDescription({ type: "answer", sdp });
    await done;
    const feedback = JSON.parse(
      text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1),
    );
    assert.ok(feedback.summary);
    await api(
      `courses/${course.id}/rehearsal`,
      { id: rehearsal.id, remarks: [transcript], feedback },
      "PATCH",
    );
    console.log(
      JSON.stringify({
        passed: true,
        transport: "WebRTC",
        receivedAudioPackets: packets,
        audioTranscript: transcript,
        feedbackSaved: true,
        microphoneUsed: false,
      }),
    );
  } finally {
    clearTimeout(watchdog);
    await pc.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
