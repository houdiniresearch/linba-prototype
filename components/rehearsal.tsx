"use client";
import { useEffect, useRef, useState } from "react";
import type { CourseState, Rehearsal } from "@/lib/types";
import { api, Icon, Logo, Loading, ErrorNote, useResource } from "./ui";
import { SlideView } from "./slides";
type Feedback = NonNullable<Rehearsal["feedback"]>;
export function RehearsalView({ id }: { id: string }) {
  const { data, error } = useResource<CourseState>(`courses/${id}`);
  const [audience, setAudience] = useState(""),
    [rehearsal, setRehearsal] = useState<Rehearsal>(),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [voice, setVoice] = useState("idle"),
    [remarks, setRemarks] = useState<string[]>([]),
    [index, setIndex] = useState(0),
    [feedback, setFeedback] = useState<Feedback>();
  const peer = useRef<RTCPeerConnection | null>(null),
    channel = useRef<RTCDataChannel | null>(null),
    stream = useRef<MediaStream | null>(null),
    speaker = useRef<HTMLAudioElement | null>(null),
    allRemarks = useRef<string[]>([]),
    responseActive = useRef(false),
    pendingFeedback = useRef(false),
    feedbackBuffer = useRef(""),
    feedbackResolver = useRef<((value: string) => void) | null>(null),
    activeSession = useRef(0);
  function close() {
    activeSession.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    channel.current?.close();
    peer.current?.close();
    peer.current = null;
    channel.current = null;
    if (speaker.current) {
      speaker.current.pause();
      speaker.current.srcObject = null;
      speaker.current = null;
    }
  }
  useEffect(() => () => close(), []);
  function send(value: unknown) {
    if (channel.current?.readyState === "open")
      channel.current.send(JSON.stringify(value));
  }
  function contextForSlide(i: number) {
    if (!data) return;
    const slide = data.course.slides[i],
      page = data.course.pages.find((p) => p.id === slide.pageId);
    send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Güncel slayt ${i + 1}: ${page?.text || slide.activity?.question}. Bu bir slayt değişimi bildirimidir; buna yanıt verme, eğitmenin konuşmasını bekle.`,
          },
        ],
      },
    });
  }
  function requestFeedback() {
    pendingFeedback.current = false;
    feedbackBuffer.current = "";
    send({
      type: "response.create",
      response: {
        output_modalities: ["text"],
        max_output_tokens: 2000,
        instructions:
          'Persona rolünü bırak. Bu oturumda gerçekten duyduğun eğitmen anlatımı ve sorduğun sorulara dayanan değerlendirme üret. Konuşma azsa dürüstçe belirt. Başarı puanı, duyulmayan söz veya olay uydurma. Yalnız Türkçe JSON: {"summary":"kısa özet","suggestions":["somut iyileştirme"],"questions":["bu provada gerçekten sorulmuş soru"]}.',
      },
    });
  }
  async function personas(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const result = await api(`courses/${id}/rehearsal`, { audience });
      setRehearsal(result.rehearsal);
      setFeedback(undefined);
      setRemarks([]);
      allRemarks.current = [];
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    if (!rehearsal) return;
    setNotice("");
    setVoice("connecting");
    const attempt = ++activeSession.current;
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (attempt !== activeSession.current) {
        mic.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = mic;
      const pc = new RTCPeerConnection();
      peer.current = pc;
      const output = new Audio();
      output.autoplay = true;
      speaker.current = output;
      pc.ontrack = (e) => {
        output.srcObject = e.streams[0];
        void output
          .play()
          .catch(() =>
            setNotice(
              "Ses çalma izni alınamadı. Tarayıcıda sayfanın sesine izin ver.",
            ),
          );
      };
      mic.getTracks().forEach((track) => pc.addTrack(track, mic));
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      dc.onopen = () => {
        setVoice("listening");
        contextForSlide(index);
      };
      dc.onmessage = (e) => {
        let event;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }
        if (event.type === "input_audio_buffer.speech_started")
          setVoice("listening");
        if (event.type === "response.created") {
          responseActive.current = true;
          if (!feedbackResolver.current) setVoice("speaking");
        }
        if (
          event.type === "response.output_audio_transcript.done" &&
          event.transcript
        ) {
          allRemarks.current.push(event.transcript);
          setRemarks([...allRemarks.current]);
        }
        if (
          event.type === "response.output_text.delta" &&
          feedbackResolver.current
        )
          feedbackBuffer.current += event.delta || "";
        if (event.type === "response.done") {
          responseActive.current = false;
          if (pendingFeedback.current) requestFeedback();
          else if (feedbackResolver.current) {
            const result =
              feedbackBuffer.current ||
              (event.response?.output || [])
                .flatMap((item: any) => item.content || [])
                .map((c: any) => c.text || "")
                .join("");
            feedbackResolver.current(result);
            feedbackResolver.current = null;
          } else setVoice("listening");
        }
        if (event.type === "error") {
          setNotice(
            "Sesli oturumda bir yanıt alınamadı. Tekrar konuşabilir veya provayı bitirebilirsin.",
          );
          if (feedbackResolver.current) {
            feedbackResolver.current("");
            feedbackResolver.current = null;
          }
        }
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setNotice("Ses bağlantısı kesildi. Yeniden bağlanabilirsin.");
          close();
          setVoice("idle");
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch(`/api/courses/${id}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: offer.sdp, rehearsalId: rehearsal.id }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }
      const sdp = await response.text();
      if (attempt !== activeSession.current) return;
      await pc.setRemoteDescription({ type: "answer", sdp });
    } catch (e) {
      close();
      setVoice("idle");
      setNotice(
        (e as Error).name === "NotAllowedError"
          ? "Prova için mikrofon izni gerekiyor. Tarayıcıdan izin vererek yeniden başlatabilirsin."
          : (e as Error).message || "Ses bağlantısı kurulamadı.",
      );
    }
  }
  async function finish() {
    if (!rehearsal) return;
    setBusy(true);
    setVoice("feedback");
    setNotice("");
    stream.current?.getTracks().forEach((t) => t.stop());
    if (speaker.current) speaker.current.muted = true;
    send({
      type: "session.update",
      session: { type: "realtime", audio: { input: { turn_detection: null } } },
    });
    let result: Feedback | undefined;
    try {
      const raw = await new Promise<string>((resolve) => {
        const timeout = setTimeout(() => {
          feedbackResolver.current = null;
          resolve("");
        }, 45000);
        feedbackResolver.current = (value) => {
          clearTimeout(timeout);
          resolve(value);
        };
        if (responseActive.current) {
          pendingFeedback.current = true;
          send({ type: "response.cancel" });
        } else requestFeedback();
      });
      if (raw) {
        const parsed = JSON.parse(
          raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
        );
        if (typeof parsed.summary === "string")
          result = {
            summary: parsed.summary,
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions.map(String)
              : [],
            questions: Array.isArray(parsed.questions)
              ? parsed.questions.map(String)
              : [],
          };
      }
      const saved = await api(
        `courses/${id}/rehearsal`,
        { id: rehearsal.id, remarks: allRemarks.current, feedback: result },
        "PATCH",
      );
      setRehearsal(saved.rehearsal);
      setFeedback(result);
      if (!result)
        setNotice(
          "Prova kaydedildi, ancak modelden geri bildirim alınamadı. Katılımcı yorumlarını aşağıda görebilirsin.",
        );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      close();
      setVoice("ended");
      setBusy(false);
    }
  }
  if (!data)
    return (
      <>
        <ErrorNote message={error} />
        <Loading />
      </>
    );
  const c = data.course,
    slide = c.slides[index];
  return (
    <div className="rehearsal-page">
      <header className="editor-header">
        <a
          href={`/egitim/${id}`}
          className="icon-button"
          aria-label="Eğitime dön"
        >
          <Icon name="back" />
        </a>
        <div className="editor-name">
          <h1>Sesli prova</h1>
          <span className="small muted">{c.name}</span>
        </div>
        <Logo />
      </header>
      {!rehearsal ? (
        <main className="rehearsal-setup">
          <span className="empty-icon">
            <Icon name="mic" size={32} />
          </span>
          <h1>Eğitimini, kitlenle prova et.</h1>
          <p>
            Kimlere eğitim vereceksin? Deneyimlerini, konuya ne kadar hâkim
            olduklarını ve beklentilerini kendi sözlerinle anlat.
          </p>
          <form onSubmit={personas}>
            <label>
              Katılımcı kitlen
              <textarea
                rows={6}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Örneğin: Kendi küçük işletmesini yöneten, dijital pazarlamaya yeni başlayan 10 kişilik bir grup. Bir kısmı sosyal medyayı aktif kullanıyor; diğerleri bütçe ayırmak konusunda çekingen…"
                minLength={10}
                maxLength={3000}
                required
              />
            </label>
            <p className="small muted">
              AI, tarifine göre farklı katılımcılar oluşturur. Mikrofonun
              yalnızca provayı başlattığında açılır.
            </p>
            <ErrorNote message={notice} />
            <button className="button primary" disabled={busy || !data.aiReady}>
              <Icon name="sparkle" />
              {busy
                ? "Katılımcılar hazırlanıyor…"
                : "Prova katılımcılarını oluştur"}
            </button>
            {!data.aiReady && (
              <ErrorNote message="Model bağlantısı ayarlanmadan sesli prova başlatılamaz." />
            )}
          </form>
          {data.rehearsals.some((r) => r.endedAt) && (
            <section className="rehearsal-history">
              <h2>Önceki provaların</h2>
              {data.rehearsals
                .filter((r) => r.endedAt)
                .map((r) => (
                  <button
                    className="joined-course"
                    key={r.id}
                    onClick={() => {
                      setRehearsal(r);
                      setVoice("ended");
                      setFeedback(r.feedback);
                      setRemarks(r.remarks);
                      allRemarks.current = r.remarks;
                    }}
                  >
                    <Icon name="mic" />
                    <span>
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                      <small>{r.audience.slice(0, 110)}</small>
                    </span>
                    <Icon name="right" />
                  </button>
                ))}
            </section>
          )}
        </main>
      ) : (
        <div className="rehearsal-layout">
          <main>
            <div className="presentation-canvas">
              <div className="canvas-join">
                <span>PROVA · {c.name}</span>
                <Logo />
              </div>
              <SlideView course={c} slide={slide} />
            </div>
            <div className="slide-controls">
              <button
                className="icon-button"
                disabled={!index}
                aria-label="Önceki slayt"
                onClick={() => {
                  setIndex(index - 1);
                  contextForSlide(index - 1);
                }}
              >
                <Icon name="left" />
              </button>
              <span>
                {index + 1} / {c.slides.length}
              </span>
              <button
                className="icon-button"
                disabled={index === c.slides.length - 1}
                aria-label="Sonraki slayt"
                onClick={() => {
                  setIndex(index + 1);
                  contextForSlide(index + 1);
                }}
              >
                <Icon name="right" />
              </button>
            </div>
            <div
              className={`voice-console ${voice === "listening" || voice === "speaking" ? "connected" : ""}`}
            >
              <span className="mic-orb">
                <Icon name="mic" size={28} />
              </span>
              <div>
                <strong>
                  {voice === "connecting"
                    ? "Ses bağlantısı kuruluyor…"
                    : voice === "listening"
                      ? "Seni dinliyorlar"
                      : voice === "speaking"
                        ? "Bir katılımcı söz aldı"
                        : voice === "feedback"
                          ? "Prova değerlendiriliyor…"
                          : voice === "ended"
                            ? "Prova tamamlandı"
                            : "Katılımcıların hazır"}
                </strong>
                <p>
                  {voice === "idle"
                    ? "Provayı başlat, eğitimini sesli anlat."
                    : voice === "ended"
                      ? "Geri bildirimini aşağıdan inceleyebilirsin."
                      : "Slaytlarını ilerlet ve doğal şekilde anlatmaya devam et."}
                </p>
              </div>
              {voice === "idle" ? (
                <button className="button primary" onClick={connect}>
                  <Icon name="mic" />
                  Provayı başlat
                </button>
              ) : ["connecting", "listening", "speaking"].includes(voice) ? (
                <button
                  className="button danger"
                  onClick={finish}
                  disabled={busy || voice === "connecting"}
                >
                  <Icon name="stop" />
                  Provayı bitir
                </button>
              ) : voice === "ended" ? (
                <button
                  className="button"
                  onClick={() => {
                    setRehearsal(undefined);
                    setVoice("idle");
                    setFeedback(undefined);
                  }}
                >
                  Yeni prova
                </button>
              ) : (
                <Icon name="spinner" className="spin" />
              )}
            </div>
            <ErrorNote message={notice} />
            {feedback && (
              <section className="report-section rehearsal-feedback">
                <span className="ai-label">
                  <Icon name="sparkle" />
                  PROVA GERİ BİLDİRİMİ
                </span>
                <h2>Bir sonraki anlatımın için</h2>
                <p>{feedback.summary}</p>
                {feedback.suggestions.length > 0 && (
                  <>
                    <h3>İyileştirme önerileri</h3>
                    <ul>
                      {feedback.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                {feedback.questions.length > 0 && (
                  <>
                    <h3>Provada sorulan sorular</h3>
                    <ul>
                      {feedback.questions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}
            <div className="rehearsal-remarks">
              <h3>Katılımcı yorumları</h3>
              {remarks.length ? (
                remarks.map((r, i) => (
                  <p key={i}>
                    <Icon name="chat" />
                    {r}
                  </p>
                ))
              ) : (
                <p className="muted">
                  Prova başladığında katılımcıların soruları ve yorumları burada
                  görünür.
                </p>
              )}
            </div>
          </main>
          <aside>
            <div className="section-title">
              <h2>Prova kitlen</h2>
              <span className="count">{rehearsal.personas.length}</span>
            </div>
            <p className="small muted">Tarif ettiğin kitleden oluşturuldu.</p>
            {rehearsal.personas.map((p, i) => (
              <div className="persona" key={i}>
                <div className="persona-title">
                  <span className={`avatar persona-${i}`}>
                    {p.name.slice(0, 1)}
                  </span>
                  <h3>{p.name}</h3>
                </div>
                <p>{p.background}</p>
                <span className="small muted">{p.behavior}</span>
              </div>
            ))}
            <details className="audience-details">
              <summary>Kitle tarifim</summary>
              <p>{rehearsal.audience}</p>
            </details>
          </aside>
        </div>
      )}
    </div>
  );
}
