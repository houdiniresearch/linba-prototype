"use client";
import { AgentMark, AgentSourceFolio } from "./agent-identity";
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
            "Some usage records could not be saved; the estimate may be incomplete.",
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
          t("Audio could not be played. Check the browser’s audio permission."),
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
                "Audio playback permission was not granted. Allow audio for this page.",
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
                  "A participant’s response could not be completed. Continue teaching or ask again.",
                ),
              );
              setVoice("listening");
            }
          } else setVoice("listening");
        }
        if (event.type === "error") {
          setNotice(
            t(
              "No response was received in the voice session. Speak again or end practice.",
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
          setNotice(t("The audio connection was lost. You can reconnect."));
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
              "Practice requires microphone permission. Allow access in your browser and try again.",
            )
          : (e as Error).message ||
              t("The audio connection could not be established."),
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
            "The practice was saved, but model feedback was unavailable. Participant comments are shown below.",
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
          href={`/training/${id}`}
          className="icon-button"
          aria-label={t("Back to training")}
        >
          <Icon name="back" />
        </a>
        <div className="editor-name">
          <h1>{t("Voice practice")}</h1>
          <span className="small muted">{c.name}</span>
        </div>
        <ThemeMenu />
        <Logo />
      </header>
      <ol className="practice-steps" aria-label={t("Practice progress")}>
        {["Your audience", "Practice", "Feedback"].map((label, step) => {
          const current = !rehearsal
            ? 0
            : voice === "ended" || voice === "feedback"
              ? 2
              : 1;
          return (
            <li
              key={label}
              aria-current={step === current ? "step" : undefined}
              className={step <= current ? "reached" : ""}
            >
              <span>{step + 1}</span>
              {t(label)}
            </li>
          );
        })}
      </ol>
      {!rehearsal ? (
        <main className="rehearsal-setup">
          <div className="practice-introduction">
            <AgentSourceFolio
              courseId={c.id}
              pageNumber={c.pages[0]?.number}
              kind="practice"
            />
            <div className="practice-introduction-copy">
              <h2>{t("Prepare with AI participant agents")}</h2>
              <p>
                {t(
                  "Who will you teach? Describe their experience, familiarity with the subject and expectations in your own words.",
                )}
              </p>
            </div>
          </div>
          {busy && <OperationProgress kind="personas" />}
          <form onSubmit={personas} hidden={busy}>
            <label>
              {t("Your audience")}
              <textarea
                rows={6}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder={t(
                  "For example: A group of 10 small-business owners new to digital marketing. Some actively use social media; others are hesitant about allocating a budget…",
                )}
                minLength={10}
                maxLength={3000}
                required
              />
            </label>
            <p className="small muted">
              {t(
                "Your description shapes the AI participant agents. Your microphone is activated only when you start practice.",
              )}
            </p>
            <ErrorNote message={notice} />
            <button className="button primary" disabled={busy || !data.aiReady}>
              <AgentMark />
              {busy
                ? t("Preparing participants…")
                : t("Create participant agents")}
            </button>
            {!data.aiReady && (
              <ErrorNote
                message={t(
                  "Configure the model connection before starting voice practice.",
                )}
              />
            )}
          </form>
          {data.rehearsals.length > 0 && (
            <section className="rehearsal-history">
              <h2>{t("Your practice sessions")}</h2>
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
                    {r.endedAt ? t("Completed") : t("Continue")}
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
                  {t("PRACTICE ·")} {c.name}
                </span>
                <Logo />
              </div>
              <SlideView course={c} slide={slide} />
            </div>
            <div className="slide-controls">
              <button
                className="icon-button"
                disabled={!index}
                aria-label={t("Previous slide")}
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
                aria-label={t("Next slide")}
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
                    ? t("Connecting audio…")
                    : voice === "listening"
                      ? t("They’re listening")
                      : voice === "thinking"
                        ? t("Participants are thinking")
                        : voice === "rendering"
                          ? t("{name} is about to speak…", {
                              name:
                                rehearsal.personas[speakingPersona ?? 0]
                                  ?.name || "",
                            })
                          : voice === "speaking"
                            ? t("{name} is speaking", {
                                name:
                                  rehearsal.personas[speakingPersona ?? 0]
                                    ?.name || "",
                              })
                            : voice === "feedback"
                              ? t("Reviewing practice…")
                              : voice === "ended"
                                ? t("Practice completed")
                                : t("Your participants are ready")}
                </strong>
                <p>
                  {voice === "idle"
                    ? t("Start practice and teach aloud.")
                    : voice === "ended"
                      ? t("Review your feedback below.")
                      : t("Advance your slides and keep teaching naturally.")}
                </p>
              </div>
              {voice === "idle" ? (
                <button
                  className="button primary"
                  onClick={connect}
                  disabled={previewing !== null || editingVoice}
                >
                  <Icon name="mic" />
                  {t("Start practice")}
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
                  {t("End practice")}
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
                  {t("New practice")}
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
                  {t("Replay participant’s line")}
                </button>
              </div>
            )}
            <details className="rehearsal-cost">
              <summary>{t("Technical usage details")}</summary>
              <div className="usage-figures">
                <span>
                  {t("Measured total")}
                  <strong>
                    {rehearsal.usage && meter.known
                      ? `$${meter.total.toFixed(5)}`
                      : t("Insufficient usage data")}
                  </strong>
                </span>
                <span>
                  {t("Additional persona audio included in total")}
                  <strong>
                    {rehearsal.usage && meter.known
                      ? `$${meter.extra.toFixed(5)}`
                      : "—"}
                  </strong>
                </span>
                <span>
                  {t("Voice previews included in total")}
                  <strong>
                    {rehearsal.usage && meter.known
                      ? `$${meter.previews.toFixed(5)}`
                      : "—"}
                  </strong>
                </span>
              </div>
              {!rehearsal.usage && (
                <p className="small muted">
                  {t("No usage data is available for this earlier practice.")}
                </p>
              )}
              <p className="small muted">
                {meter.input.toLocaleString(
                  locale === "en" ? "en-GB" : "tr-TR",
                )}{" "}
                {t("input ·")}{" "}
                {meter.output.toLocaleString(
                  locale === "en" ? "en-GB" : "tr-TR",
                )}{" "}
                {t(
                  "output tokens. Includes participant creation, conversation, feedback and played voice previews.",
                )}
              </p>
              <p className="small muted">
                {t(
                  "The speech row shows extra calls for different voices, not the total price difference from the earlier version. This is a USD estimate based on available usage records, not an invoice. Disconnections may leave incomplete records. Pricing checked:",
                )}{" "}
                {PRICE_DATE}.
              </p>
            </details>
            {feedback && (
              <section className="report-section rehearsal-feedback">
                <span className="ai-label">
                  <AgentMark />
                  {t("PRACTICE FEEDBACK")}
                </span>
                <h2>{t("For your next session")}</h2>
                <p>{feedback.summary}</p>
                {feedback.suggestions.length > 0 && (
                  <>
                    <h3>{t("Suggestions for improvement")}</h3>
                    <ul>
                      {feedback.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                {feedback.questions.length > 0 && (
                  <>
                    <h3>{t("Questions asked in practice")}</h3>
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
              <h3>{t("Participant comments")}</h3>
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
                    "Participants’ questions and comments will appear here when practice starts.",
                  )}
                </p>
              )}
            </div>
          </main>
          <aside>
            <div className="section-title">
              <h2>{t("AI participant agents")}</h2>
              <span className="count">{rehearsal.personas.length}</span>
            </div>
            <p className="small muted">
              {t("Created from your audience description.")}
            </p>
            <details className="audience-details">
              <summary>{t("My audience description")}</summary>
              <p>{rehearsal.audience}</p>
              <a className="text-button" href={`/training/${id}/practice`}>
                {t("Prepare a different audience")}
              </a>
            </details>
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
                <p className="persona-summary">
                  {p.background.split(/(?<=[.!?])\s/)[0]}
                </p>
                <p className="persona-approach">
                  <span>{t("Question style")}</span>
                  {p.behavior.split(/(?<=[.!?])\s/)[0]}
                </p>
                <details className="persona-details">
                  <summary>{t("Profile and voice settings")}</summary>
                  <p>{p.background}</p>
                  <p className="muted">{p.behavior}</p>
                  <div className="persona-voice-controls">
                    <label>
                      {t("Voice style")}
                      <select
                        aria-label={t("{name} voice style", { name: p.name })}
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
                      {t("Voice")}
                      <select
                        aria-label={t("{name} voice", { name: p.name })}
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
                          ? t("Preparing / playing…")
                          : t("Preview voice")}
                      </button>
                    )}
                  </div>
                </details>
              </div>
            ))}
            <p className="small muted">
              {t(
                "Voices are AI-generated. Voice style describes timbre; preview and change it before practice. Voice previews also count toward API usage.",
              )}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
