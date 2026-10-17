"use client";
import { OperationProgress } from "./operation-progress";
import { ThemeMenu } from "./theme-menu";
import { RehearsalSkeleton } from "./skeletons";
import { useLocale } from "./locale-provider";
import { useEffect, useRef, useState } from "react";
import type { CourseState, Rehearsal } from "@/lib/types";
import { api, Icon, Logo, ResourceFailure, ErrorNote, useResource } from "./ui";
import { SlideView } from "./slides";
import {
  feedbackRequest,
  roleRepairRequest,
  participantCall,
  feedbackArguments,
} from "@/lib/rehearsal-prompts";
import {
  assignVoices,
  parsePersonaTurn,
  voicesFor,
  VOICE_STYLE_LABELS,
  voiceStyle,
  type VoiceId,
  type VoiceStyle,
} from "@/lib/voices";
import {
  appendUsage,
  usageSummary,
  PRICE_DATE,
  type UsageEntry,
} from "@/lib/voice-usage";
type Feedback = NonNullable<Rehearsal["feedback"]>;
export function RehearsalView({ id }: { id: string }) {
  const { t, locale } = useLocale();

  const { data, error, refresh } = useResource<CourseState>(`courses/${id}`);
  const [audience, setAudience] = useState(""),
    [rehearsal, setRehearsal] = useState<Rehearsal>(),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [voice, setVoice] = useState("idle"),
    [remarks, setRemarks] = useState<string[]>([]),
    [index, setIndex] = useState(0),
    [feedback, setFeedback] = useState<Feedback>();
  const [speakingPersona, setSpeakingPersona] = useState<number | null>(null),
    [previewing, setPreviewing] = useState<number | null>(null),
    [editingVoice, setEditingVoice] = useState(false),
    [retryLine, setRetryLine] = useState<{
      personaIndex: number;
      text: string;
    }>();
  const peer = useRef<RTCPeerConnection | null>(null),
    channel = useRef<RTCDataChannel | null>(null),
    stream = useRef<MediaStream | null>(null),
    speaker = useRef<HTMLAudioElement | null>(null),
    allRemarks = useRef<string[]>([]),
    responseActive = useRef(false),
    pendingFeedback = useRef(false),
    feedbackResolver = useRef<((value: string) => void) | null>(null),
    activeSession = useRef(0),
    finishing = useRef(false),
    feedbackResponseId = useRef(""),
    turnResponseId = useRef(""),
    roleRepairUsed = useRef(false);
  const clip = useRef<HTMLAudioElement | null>(null),
    clipUrl = useRef(""),
    clipVersion = useRef(0);
  const clipTurn = useRef<{
    personaIndex: number;
    text: string;
    started: boolean;
  } | null>(null);
  const usagePending = useRef(new Set<Promise<unknown>>()),
    speechPending = useRef(new Set<Promise<unknown>>());
  function stopClip() {
    if (clipTurn.current) {
      playbackContext(
        clipTurn.current,
        clipTurn.current.started ? "interrupted" : "not_played",
      );
      clipTurn.current = null;
    }
    clipVersion.current++;
    if (clip.current) {
      clip.current.pause();
      clip.current.src = "";
      clip.current = null;
    }
    if (clipUrl.current) {
      URL.revokeObjectURL(clipUrl.current);
      clipUrl.current = "";
    }
    setSpeakingPersona(null);
    setPreviewing(null);
  }
  function close() {
    stopClip();
    activeSession.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    channel.current?.close();
    peer.current?.close();
    peer.current = null;
    channel.current = null;
    responseActive.current = false;
    pendingFeedback.current = false;
    feedbackResponseId.current = "";
    turnResponseId.current = "";
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
  function playbackContext(
    turn: { personaIndex: number; text: string },
    status: string,
  ) {
    send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `APP_PLAYBACK ${JSON.stringify({ ...turn, status })}`,
          },
        ],
      },
    });
  }
  function captureUsage(event: any) {
    if (!rehearsal || !event.response?.usage) return;
    const job = api(`courses/${id}/rehearsal-usage`, {
      rehearsalId: rehearsal.id,
      responseId: event.response.id,
      usage: event.response.usage,
    })
      .then((r) =>
        setRehearsal((prev) =>
          prev?.id === rehearsal.id
            ? {
                ...prev,
                usage: (r.usage as UsageEntry[]).reduce(
                  appendUsage,
                  prev.usage || [],
                ),
              }
            : prev,
        ),
      )
      .catch(() =>
        setNotice(
          t(
            "Kullanım kaydının bir bölümü kaydedilemedi; gösterilen tahmin eksik olabilir.",
          ),
        ),
      );
    usagePending.current.add(job);
    void job.finally(() => usagePending.current.delete(job));
  }
  async function playLine(personaIndex: number, line: string, preview = false) {
    if (!rehearsal) return;
    stopClip();
    const version = clipVersion.current;
    if (preview) setPreviewing(personaIndex);
    else {
      clipTurn.current = { personaIndex, text: line, started: false };
      setSpeakingPersona(personaIndex);
      setVoice("rendering");
    }
    setNotice("");
    setRetryLine(undefined);
    try {
      const response = await fetch(`/api/courses/${id}/rehearsal-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rehearsalId: rehearsal.id,
          personaIndex,
          text: line,
          preview,
        }),
        signal: AbortSignal.timeout(55000),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }
      const entry = response.headers.get("X-Linba-Usage");
      if (entry)
        setRehearsal((prev) =>
          prev?.id === rehearsal.id
            ? {
                ...prev,
                usage: appendUsage(
                  prev.usage || [],
                  JSON.parse(entry) as UsageEntry,
                ),
              }
            : prev,
        );
      const blob = await response.blob();
      if (version !== clipVersion.current) return;
      clipUrl.current = URL.createObjectURL(blob);
      const audio = new Audio(clipUrl.current);
      clip.current = audio;
      audio.onplaying = () => {
        if (
          version === clipVersion.current &&
          !preview &&
          clipTurn.current &&
          !clipTurn.current.started
        ) {
          clipTurn.current.started = true;
          playbackContext(clipTurn.current, "started");
          allRemarks.current.push(
            `${rehearsal.personas[personaIndex].name}: ${line}`,
          );
          setRemarks([...allRemarks.current]);
        }
      };
      audio.onended = () => {
        if (version === clipVersion.current) {
          if (clipTurn.current) {
            playbackContext(clipTurn.current, "completed");
            clipTurn.current = null;
          }
          stopClip();
          if (!preview) setVoice("listening");
        }
      };
      if (!preview) setVoice("speaking");
      await audio.play();
    } catch (e) {
      if (version !== clipVersion.current) return;
      setNotice(
        (e as Error).message ||
          t("Ses oynatılamadı. Tarayıcıda ses iznini kontrol et."),
      );
      if (!preview) setRetryLine({ personaIndex, text: line });
      stopClip();
      if (!preview) setVoice("listening");
    }
  }
  function speak(personaIndex: number, line: string, preview = false) {
    const job = playLine(personaIndex, line, preview);
    speechPending.current.add(job);
    void job.finally(() => speechPending.current.delete(job));
  }
  async function changeVoice(i: number, gender: VoiceStyle, voice: VoiceId) {
    if (!rehearsal) return;
    stopClip();
    setEditingVoice(true);
    setNotice("");
    try {
      const result = await api(
        `courses/${id}/rehearsal`,
        { id: rehearsal.id, action: "voice", personaIndex: i, gender, voice },
        "PATCH",
      );
      setRehearsal(result.rehearsal);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setEditingVoice(false);
    }
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
            text: `APP_CONTEXT ${JSON.stringify({ slideNumber: i + 1, title: page?.title, text: page?.text || slide.activity?.question })}`,
          },
        ],
      },
    });
  }
  function requestFeedback() {
    pendingFeedback.current = false;
    send(feedbackRequest());
  }
  async function personas(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await api(`courses/${id}/rehearsal`, { audience });
      setRehearsal(result.rehearsal);
      setFeedback(undefined);
      setRemarks([]);
      allRemarks.current = [];
      setVoice("idle");
      setRetryLine(undefined);
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
    finishing.current = false;
    roleRepairUsed.current = false;
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
              t(
                "Ses çalma izni alınamadı. Tarayıcıda sayfanın sesine izin ver.",
              ),
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
        if (attempt !== activeSession.current) return;
        let event;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }
        if (event.type === "input_audio_buffer.speech_started") {
          if (finishing.current) return;
          roleRepairUsed.current = false;
          stopClip();
          setVoice("listening");
        }
        if (event.type === "response.created") {
          if (event.response?.metadata?.purpose === "rehearsal_feedback") {
            feedbackResponseId.current = event.response.id;
            return;
          }
          responseActive.current = true;
          turnResponseId.current = event.response.id;
          if (!feedbackResolver.current) setVoice("thinking");
        }
        if (event.type === "response.done") {
          captureUsage(event);
          if (
            event.response?.metadata?.purpose === "rehearsal_feedback" ||
            event.response?.id === feedbackResponseId.current
          ) {
            if (feedbackResolver.current) {
              try {
                feedbackResolver.current(feedbackArguments(event.response));
              } catch {
                feedbackResolver.current("");
              }
              feedbackResolver.current = null;
            }
            return;
          }
          if (event.response?.id !== turnResponseId.current) return;
          responseActive.current = false;
          if (pendingFeedback.current) requestFeedback();
          else if (finishing.current) return;
          else if (event.response?.status === "completed") {
            try {
              const call = participantCall(event.response);
              send({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: call.call_id,
                  output: JSON.stringify({
                    received: true,
                    playback: "not_started",
                  }),
                },
              });
              const raw = call.arguments!;
              const turn = parsePersonaTurn(raw, rehearsal.personas.length);
              if (turn) {
                speak(turn.personaIndex, turn.text);
              } else setVoice("listening");
            } catch (e) {
              if (
                ["PARTICIPANT_ROLE_LEAK", "PARTICIPANT_TURN_INVALID"].includes(
                  (e as Error).message,
                ) &&
                !roleRepairUsed.current
              ) {
                roleRepairUsed.current = true;
                send(roleRepairRequest(rehearsal.audience, rehearsal.personas));
                return;
              }
              setNotice(
                t(
                  "Bir katılımcının yanıtı tamamlanamadı. Anlatımına devam edebilir veya sorunu yeniden sorabilirsin.",
                ),
              );
              setVoice("listening");
            }
          } else setVoice("listening");
        }
        if (event.type === "error") {
          setNotice(
            t(
              "Sesli oturumda bir yanıt alınamadı. Tekrar konuşabilir veya provayı bitirebilirsin.",
            ),
          );
          if (feedbackResolver.current) {
            feedbackResolver.current("");
            feedbackResolver.current = null;
          }
        }
      };
      pc.onconnectionstatechange = () => {
        if (attempt !== activeSession.current) return;
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setNotice(t("Ses bağlantısı kesildi. Yeniden bağlanabilirsin."));
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
          ? t(
              "Prova için mikrofon izni gerekiyor. Tarayıcıdan izin vererek yeniden başlatabilirsin.",
            )
          : (e as Error).message || t("Ses bağlantısı kurulamadı."),
      );
    }
  }
  async function finish() {
    if (!rehearsal) return;
    setBusy(true);
    finishing.current = true;
    setVoice("feedback");
    setNotice("");
    stopClip();
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
      await Promise.allSettled([
        ...usagePending.current,
        ...speechPending.current,
      ]);
      const saved = await api(
        `courses/${id}/rehearsal`,
        { id: rehearsal.id, remarks: allRemarks.current, feedback: result },
        "PATCH",
      );
      setRehearsal(saved.rehearsal);
      setFeedback(result);
      if (!result)
        setNotice(
          t(
            "Prova kaydedildi, ancak modelden geri bildirim alınamadı. Katılımcı yorumlarını aşağıda görebilirsin.",
          ),
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
    return error ? (
      <ResourceFailure error={error} onRetry={refresh} />
    ) : (
      <RehearsalSkeleton />
    );
  const c = data.course,
    slide = c.slides[index];
  const meter = usageSummary(rehearsal?.usage || []),
    editable = voice === "idle" && !editingVoice && previewing === null;
  return (
    <div className="rehearsal-page">
      <header className="editor-header">
        <a
          href={`/egitim/${id}`}
          className="icon-button"
          aria-label={t("Eğitime dön")}
        >
          <Icon name="back" />
        </a>
        <div className="editor-name">
          <h1>{t("Sesli prova")}</h1>
          <span className="small muted">{c.name}</span>
        </div>
        <ThemeMenu />
        <Logo />
      </header>
      {!rehearsal ? (
        <main className="rehearsal-setup">
          <span className="empty-icon">
            <Icon name="mic" size={32} />
          </span>
          <h1>{t("Eğitimini, kitlenle prova et.")}</h1>
          <p>
            {t(
              "Kimlere eğitim vereceksin? Deneyimlerini, konuya ne kadar hâkim olduklarını ve beklentilerini kendi sözlerinle anlat.",
            )}
          </p>
          {busy && <OperationProgress kind="personas" />}
          <form onSubmit={personas} hidden={busy}>
            <label>
              {t("Katılımcı kitlen")}
              <textarea
                rows={6}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder={t(
                  "Örneğin: Kendi küçük işletmesini yöneten, dijital pazarlamaya yeni başlayan 10 kişilik bir grup. Bir kısmı sosyal medyayı aktif kullanıyor; diğerleri bütçe ayırmak konusunda çekingen…",
                )}
                minLength={10}
                maxLength={3000}
                required
              />
            </label>
            <p className="small muted">
              {t(
                "AI, tarifine göre farklı katılımcılar oluşturur. Mikrofonun yalnızca provayı başlattığında açılır.",
              )}
            </p>
            <ErrorNote message={notice} />
            <button className="button primary" disabled={busy || !data.aiReady}>
              <Icon name="sparkle" />
              {busy
                ? t("Katılımcılar hazırlanıyor…")
                : t("Prova katılımcılarını oluştur")}
            </button>
            {!data.aiReady && (
              <ErrorNote
                message={t(
                  "Model bağlantısı ayarlanmadan sesli prova başlatılamaz.",
                )}
              />
            )}
          </form>
          {data.rehearsals.length > 0 && (
            <section className="rehearsal-history">
              <h2>{t("Provaların")}</h2>
              {data.rehearsals.map((r) => (
                <button
                  className="joined-course"
                  disabled={busy}
                  key={r.id}
                  onClick={() => {
                    setRehearsal(r);
                    setVoice(r.endedAt ? "ended" : "idle");
                    setAudience(r.audience);
                    setFeedback(r.feedback);
                    setRemarks(r.remarks);
                    allRemarks.current = r.remarks;
                  }}
                >
                  <Icon name="mic" />
                  <span>
                    {new Date(r.createdAt).toLocaleDateString(
                      locale === "en" ? "en-GB" : "tr-TR",
                    )}
                    {" · "}
                    {r.endedAt ? t("Tamamlandı") : t("Devam et")}
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
                <span>
                  {t("PROVA ·")} {c.name}
                </span>
                <Logo />
              </div>
              <SlideView course={c} slide={slide} />
            </div>
            <div className="slide-controls">
              <button
                className="icon-button"
                disabled={!index}
                aria-label={t("Önceki slayt")}
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
                aria-label={t("Sonraki slayt")}
                onClick={() => {
                  setIndex(index + 1);
                  contextForSlide(index + 1);
                }}
              >
                <Icon name="right" />
              </button>
            </div>
            <div
              className={`voice-console ${["listening", "speaking", "thinking", "rendering"].includes(voice) ? "connected" : ""}`}
            >
              <span className="mic-orb">
                <Icon name="mic" size={28} />
              </span>
              <div>
                <strong>
                  {voice === "connecting"
                    ? t("Ses bağlantısı kuruluyor…")
                    : voice === "listening"
                      ? t("Seni dinliyorlar")
                      : voice === "thinking"
                        ? t("Katılımcılar düşünüyor")
                        : voice === "rendering"
                          ? t("{name} söz alıyor…", {
                              name:
                                rehearsal.personas[speakingPersona ?? 0]
                                  ?.name || "",
                            })
                          : voice === "speaking"
                            ? t("{name} konuşuyor", {
                                name:
                                  rehearsal.personas[speakingPersona ?? 0]
                                    ?.name || "",
                              })
                            : voice === "feedback"
                              ? t("Prova değerlendiriliyor…")
                              : voice === "ended"
                                ? t("Prova tamamlandı")
                                : t("Katılımcıların hazır")}
                </strong>
                <p>
                  {voice === "idle"
                    ? t("Provayı başlat, eğitimini sesli anlat.")
                    : voice === "ended"
                      ? t("Geri bildirimini aşağıdan inceleyebilirsin.")
                      : t(
                          "Slaytlarını ilerlet ve doğal şekilde anlatmaya devam et.",
                        )}
                </p>
              </div>
              {voice === "idle" ? (
                <button
                  className="button primary"
                  onClick={connect}
                  disabled={previewing !== null || editingVoice}
                >
                  <Icon name="mic" />
                  {t("Provayı başlat")}
                </button>
              ) : [
                  "connecting",
                  "listening",
                  "speaking",
                  "thinking",
                  "rendering",
                ].includes(voice) ? (
                <button
                  className="button danger"
                  onClick={finish}
                  disabled={busy || voice === "connecting"}
                >
                  <Icon name="stop" />
                  {t("Provayı bitir")}
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
                  {t("Yeni prova")}
                </button>
              ) : (
                <Icon name="spinner" className="spin" />
              )}
            </div>
            {voice === "feedback" && (
              <OperationProgress kind="feedback" compact />
            )}
            <ErrorNote message={notice} />
            {retryLine && voice === "listening" && (
              <div>
                <p>
                  <strong>
                    {rehearsal.personas[retryLine.personaIndex].name}:
                  </strong>{" "}
                  {retryLine.text}
                </p>
                <button
                  className="button"
                  onClick={() => speak(retryLine.personaIndex, retryLine.text)}
                >
                  <Icon name="play" />
                  {t("Katılımcı repliğini yeniden seslendir")}
                </button>
              </div>
            )}
            <details className="rehearsal-cost" open={voice === "ended"}>
              <summary>{t("Prova kullanımı ve tahmini ücret")}</summary>
              <div className="usage-figures">
                <span>
                  {t("Ölçülen toplam")}
                  <strong>
                    {rehearsal.usage && meter.known
                      ? `$${meter.total.toFixed(5)}`
                      : t("Kullanım kaydı yetersiz")}
                  </strong>
                </span>
                <span>
                  {t("Toplama dahil ek karakter sesleri")}
                  <strong>
                    {rehearsal.usage && meter.known
                      ? `$${meter.extra.toFixed(5)}`
                      : "—"}
                  </strong>
                </span>
                <span>
                  {t("Toplama dahil ses örnekleri")}
                  <strong>
                    {rehearsal.usage && meter.known
                      ? `$${meter.previews.toFixed(5)}`
                      : "—"}
                  </strong>
                </span>
              </div>
              {!rehearsal.usage && (
                <p className="small muted">
                  {t("Bu eski prova için kullanım kaydı bulunmuyor.")}
                </p>
              )}
              <p className="small muted">
                {meter.input.toLocaleString(
                  locale === "en" ? "en-GB" : "tr-TR",
                )}{" "}
                {t("giriş ·")}{" "}
                {meter.output.toLocaleString(
                  locale === "en" ? "en-GB" : "tr-TR",
                )}{" "}
                {t(
                  "çıkış tokenı. Katılımcı oluşturma, konuşma, değerlendirme ve dinlenen ses örnekleri ölçüme dahildir.",
                )}
              </p>
              <p className="small muted">
                {t(
                  "Ses üretimi satırı, farklı sesler için ek çağrıları gösterir; eski sürümle toplam fiyat farkı değildir. Alınabilen kullanım kayıtları üzerinden USD tahminidir, fatura değildir. Bağlantı kesintilerinde kayıtlar eksik kalabilir. Birim fiyat kontrolü:",
                )}{" "}
                {PRICE_DATE}.
              </p>
            </details>
            {feedback && (
              <section className="report-section rehearsal-feedback">
                <span className="ai-label">
                  <Icon name="sparkle" />
                  {t("PROVA GERİ BİLDİRİMİ")}
                </span>
                <h2>{t("Bir sonraki anlatımın için")}</h2>
                <p>{feedback.summary}</p>
                {feedback.suggestions.length > 0 && (
                  <>
                    <h3>{t("İyileştirme önerileri")}</h3>
                    <ul>
                      {feedback.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                {feedback.questions.length > 0 && (
                  <>
                    <h3>{t("Provada sorulan sorular")}</h3>
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
              <h3>{t("Katılımcı yorumları")}</h3>
              {remarks.length ? (
                remarks.map((r, i) => (
                  <p key={i}>
                    <Icon name="chat" />
                    {r}
                  </p>
                ))
              ) : (
                <p className="muted">
                  {t(
                    "Prova başladığında katılımcıların soruları ve yorumları burada görünür.",
                  )}
                </p>
              )}
            </div>
          </main>
          <aside>
            <div className="section-title">
              <h2>{t("Prova kitlen")}</h2>
              <span className="count">{rehearsal.personas.length}</span>
            </div>
            <p className="small muted">
              {t("Tarif ettiğin kitleden oluşturuldu.")}
            </p>
            {assignVoices(rehearsal.personas).map((p, i) => (
              <div
                className={`persona ${speakingPersona === i ? "persona-speaking" : ""}`}
                key={i}
              >
                <div className="persona-title">
                  <span className={`avatar persona-${i}`}>
                    {p.name.slice(0, 1)}
                  </span>
                  <h3>{p.name}</h3>
                </div>
                <p>{p.background}</p>
                <span className="small muted">{p.behavior}</span>
                <div className="persona-voice-controls">
                  <label>
                    {t("Ses türü")}
                    <select
                      aria-label={t("{name} ses türü", { name: p.name })}
                      value={p.gender}
                      disabled={!editable || !!rehearsal.endedAt}
                      onChange={(e) => {
                        const gender = voiceStyle(e.target.value);
                        void changeVoice(i, gender, voicesFor(gender)[0].id);
                      }}
                    >
                      {Object.entries(VOICE_STYLE_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {t(label)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label>
                    {t("Ses")}
                    <select
                      aria-label={t("{name} sesi", { name: p.name })}
                      value={p.voice}
                      disabled={!editable || !!rehearsal.endedAt}
                      onChange={(e) =>
                        void changeVoice(
                          i,
                          voiceStyle(p.gender),
                          e.target.value as VoiceId,
                        )
                      }
                    >
                      {voicesFor(voiceStyle(p.gender)).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!rehearsal.endedAt && (
                    <button
                      className="button"
                      disabled={
                        (!editable && previewing !== i) || previewing !== null
                      }
                      onClick={() => speak(i, "", true)}
                    >
                      <Icon
                        name={previewing === i ? "spinner" : "play"}
                        className={previewing === i ? "spin" : undefined}
                      />
                      {previewing === i
                        ? t("Hazırlanıyor / çalıyor…")
                        : t("Sesi dinle")}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <p className="small muted">
              {t(
                "Sesler yapay zekâ tarafından üretilir. Ses türü tınıyı belirtir; prova öncesinde dinleyip değiştirebilirsin. Ses örnekleri de API kullanımına dahildir.",
              )}
            </p>
            <details className="audience-details">
              <summary>{t("Kitle tarifim")}</summary>
              <p>{rehearsal.audience}</p>
            </details>
          </aside>
        </div>
      )}
    </div>
  );
}
