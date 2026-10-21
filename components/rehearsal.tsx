"use client";
import { AgentMark, AgentIllustration } from "./agent-identity";
import { PracticeWorkspace } from "./practice-workspace";
import { PracticeFeedback } from "./practice-feedback";
import {
  PracticeClock,
  formatPracticeDuration,
  PRACTICE_LIMIT_SECONDS,
  practiceBudgetReached,
} from "@/lib/practice-clock";
import type { PracticeVoiceState } from "@/lib/practice-state";
import {
  PracticeTurnTaking,
  practiceTurnDetection,
} from "@/lib/practice-turn-taking";
import { OperationProgress } from "./operation-progress";
import { RehearsalSkeleton } from "./skeletons";
import { useProductLocale as useLocale } from "./product-locale";
import { useEffect, useRef, useState } from "react";
import type { CourseState, Rehearsal } from "@/lib/types";
import { api, Icon, Logo, ResourceFailure, ErrorNote, useResource } from "./ui";
import {
  feedbackRequest,
  roleRepairRequest,
  participantCall,
  feedbackArguments,
} from "@/lib/rehearsal-prompts";
import { parsePersonaTurn } from "@/lib/voices";
import {
  parsePracticeFeedback,
  PRACTICE_GREETING,
  shouldGreetPractice,
} from "@/lib/practice-quality";
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
    [voice, setVoice] = useState<PracticeVoiceState>("idle"),
    [remarks, setRemarks] = useState<string[]>([]),
    [index, setIndex] = useState(0),
    [feedback, setFeedback] = useState<Feedback>();
  const [speakingPersona, setSpeakingPersona] = useState<number | null>(null),
    [previewing, setPreviewing] = useState<number | null>(null),
    [retryLine, setRetryLine] = useState<{
      personaIndex: number;
      text: string;
    }>();
  const peer = useRef<RTCPeerConnection | null>(null),
    channel = useRef<RTCDataChannel | null>(null),
    stream = useRef<MediaStream | null>(null),
    speaker = useRef<HTMLAudioElement | null>(null),
    allRemarks = useRef<string[]>([]),
    completedRemarks = useRef<string[]>([]),
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
  const turnTaking = useRef(
    new PracticeTurnTaking({
      microphone: (enabled) =>
        stream.current?.getAudioTracks().forEach((track) => {
          track.enabled = enabled;
        }),
      automaticResponses: (enabled) =>
        send({
          type: "session.update",
          session: {
            type: "realtime",
            audio: {
              input: { turn_detection: practiceTurnDetection(enabled) },
            },
          },
        }),
      clearInput: () => send({ type: "input_audio_buffer.clear" }),
    }),
  );
  const usagePending = useRef(new Set<Promise<unknown>>()),
    speechPending = useRef(new Set<Promise<unknown>>());
  const clock = useRef(new PracticeClock());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationKnown, setDurationKnown] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackButton = useRef<HTMLButtonElement>(null);
  const practiceDeadline = useRef(0);
  const greetedSessions = useRef(new Set<string>());
  const finishLatest = useRef(finish);
  useEffect(() => {
    finishLatest.current = finish;
  });
  async function openFeedback() {
    // A body-portal dialog cannot appear over the browser's fullscreen subtree.
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        setNotice(t("Exit full screen to view your feedback."));
        return;
      }
    }
    setFeedbackOpen(true);
  }
  useEffect(() => {
    const check = () => {
      const seconds = clock.current.seconds(performance.now());
      setElapsedSeconds(Math.min(seconds, PRACTICE_LIMIT_SECONDS));
      if (
        !finishing.current &&
        peer.current?.connectionState === "connected" &&
        practiceBudgetReached(seconds, practiceDeadline.current)
      )
        void finishLatest.current();
    };
    const tick = setInterval(check, 250);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  function resetClock(session?: Rehearsal) {
    clock.current.reset(session?.durationSeconds || 0);
    setElapsedSeconds(session?.durationSeconds || 0);
    setDurationKnown(
      !session?.endedAt || typeof session.durationSeconds === "number",
    );
    setMicMuted(false);
  }
  function stopClock() {
    const seconds = Math.min(
      clock.current.stop(performance.now()),
      PRACTICE_LIMIT_SECONDS,
    );
    setElapsedSeconds(seconds);
    return seconds;
  }
  function toggleMic() {
    const muted = !turnTaking.current.muted;
    turnTaking.current.setMuted(muted);
    setMicMuted(muted);
  }
  function listen() {
    if (finishing.current) return;
    turnTaking.current.listen();
    setVoice("listening");
  }
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
    turnTaking.current.stop();
    stopClock();
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
    turnTaking.current.hold();
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
          setVoice("speaking");
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
            completedRemarks.current.push(clipTurn.current.text);
            clipTurn.current = null;
          }
          stopClip();
          if (!preview) listen();
          else turnTaking.current.listen();
        }
      };
      audio.onerror = () => {
        if (version !== clipVersion.current) return;
        setNotice(
          t("Audio could not be played. Check the browser’s audio permission."),
        );
        if (!preview) setRetryLine({ personaIndex, text: line });
        stopClip();
        if (!preview) listen();
        else turnTaking.current.listen();
      };
      await audio.play();
    } catch (e) {
      if (version !== clipVersion.current) return;
      if (
        !preview &&
        ["PARTICIPANT_ROLE_LEAK", "PARTICIPANT_TURN_TOO_LONG"].includes(
          (e as Error).message,
        ) &&
        !roleRepairUsed.current
      ) {
        stopClip();
        roleRepairUsed.current = true;
        setVoice("thinking");
        send(
          roleRepairRequest(
            rehearsal.audience,
            rehearsal.personas,
            (e as Error).message === "PARTICIPANT_TURN_TOO_LONG"
              ? "length"
              : "role",
          ),
        );
        return;
      }
      setNotice(
        (["PARTICIPANT_ROLE_LEAK", "PARTICIPANT_TURN_TOO_LONG"].includes(
          (e as Error).message,
        )
          ? ""
          : (e as Error).message) ||
          t("Audio could not be played. Check the browser’s audio permission."),
      );
      if (!preview) setRetryLine({ personaIndex, text: line });
      stopClip();
      if (!preview) listen();
      else turnTaking.current.listen();
    }
  }
  function speak(personaIndex: number, line: string, preview = false) {
    const job = playLine(personaIndex, line, preview);
    speechPending.current.add(job);
    void job.finally(() => speechPending.current.delete(job));
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
      setFeedbackOpen(false);
      resetClock(result.rehearsal);
      setIndex(0);
      setRemarks([]);
      allRemarks.current = [];
      completedRemarks.current = [];
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
    setMicMuted(false);
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
      turnTaking.current.start();
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
        if (attempt !== activeSession.current) return;
        clock.current.start(performance.now());
        setDurationKnown(true);
        contextForSlide(index);
        if (shouldGreetPractice(rehearsal, greetedSessions.current)) {
          greetedSessions.current.add(rehearsal.id);
          speak(0, PRACTICE_GREETING);
        } else listen();
      };
      dc.onclose = () => {
        if (attempt !== activeSession.current || finishing.current) return;
        setNotice(t("The audio connection was lost. You can reconnect."));
        close();
        setVoice("disconnected");
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
          if (finishing.current || !turnTaking.current.acceptsSpeech) return;
          roleRepairUsed.current = false;
          setVoice("listening");
        }
        if (event.type === "response.created") {
          if (event.response?.metadata?.purpose === "rehearsal_feedback") {
            feedbackResponseId.current = event.response.id;
            return;
          }
          if (finishing.current || clipTurn.current || clip.current) {
            // Ignore a late VAD response from audio queued before the handoff.
            send({ type: "response.cancel", response_id: event.response.id });
            return;
          }
          turnTaking.current.hold();
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
              } else listen();
            } catch (e) {
              if (
                [
                  "PARTICIPANT_ROLE_LEAK",
                  "PARTICIPANT_TURN_INVALID",
                  "PARTICIPANT_TURN_TOO_LONG",
                ].includes((e as Error).message) &&
                !roleRepairUsed.current
              ) {
                roleRepairUsed.current = true;
                send(
                  roleRepairRequest(
                    rehearsal.audience,
                    rehearsal.personas,
                    (e as Error).message === "PARTICIPANT_TURN_TOO_LONG"
                      ? "length"
                      : "role",
                  ),
                );
                return;
              }
              setNotice(
                t(
                  "A participant’s response could not be completed. Continue teaching or ask again.",
                ),
              );
              listen();
            }
          } else listen();
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
          if (!finishing.current && !clipTurn.current && !clip.current) {
            responseActive.current = false;
            turnResponseId.current = "";
            listen();
          }
        }
      };
      pc.onconnectionstatechange = () => {
        if (attempt !== activeSession.current || finishing.current) return;
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          setNotice(t("The audio connection was lost. You can reconnect."));
          close();
          setVoice("disconnected");
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
      practiceDeadline.current =
        Date.parse(response.headers.get("X-Linba-Practice-Expires-At") || "") ||
        Date.now() + PRACTICE_LIMIT_SECONDS * 1000;
      if (attempt !== activeSession.current) return;
      await pc.setRemoteDescription({ type: "answer", sdp });
    } catch (e) {
      if (attempt !== activeSession.current) return;
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
    if (!rehearsal || finishing.current) return;
    const durationSeconds = stopClock();
    setBusy(true);
    finishing.current = true;
    turnTaking.current.stop();
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
        try {
          result = parsePracticeFeedback(
            JSON.parse(raw),
            completedRemarks.current,
          );
        } catch {
          result = undefined;
        }
      }
      await Promise.allSettled([
        ...usagePending.current,
        ...speechPending.current,
      ]);
      const saved = await api(
        `courses/${id}/rehearsal`,
        {
          id: rehearsal.id,
          remarks: allRemarks.current,
          feedback: result,
          durationSeconds,
        },
        "PATCH",
      );
      setRehearsal(saved.rehearsal);
      setFeedback(result);
      // Open only when new feedback is saved, never from a render/timer effect.
      if (result) await openFeedback();
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
  const c = data.course;
  const meter = usageSummary(rehearsal?.usage || []),
    editable = voice === "idle" && previewing === null;
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
        <ol
          className="practice-steps practice-steps-inline"
          aria-label={t("Practice progress")}
        >
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
        <Logo />
      </header>

      {!rehearsal ? (
        <main className="practice-preparation">
          <section className="practice-preparation-form">
            <div className="practice-introduction">
              <AgentIllustration kind="practice" />
              <div className="practice-introduction-copy">
                <h2>{t("Prepare with AI rehearsal agents")}</h2>
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
                  "Your description shapes the AI rehearsal agents. Your microphone is activated only when you start practice.",
                )}
              </p>
              <ErrorNote message={notice} />
              <button
                className="button primary"
                disabled={busy || !data.aiReady}
              >
                <AgentMark />
                {busy
                  ? t("Creating your practice agents…")
                  : t("Create rehearsal agents")}
              </button>
              {!data.aiReady && (
                <ErrorNote
                  message={t(
                    "Configure the model connection before starting voice practice.",
                  )}
                />
              )}
            </form>
          </section>
          {data.rehearsals.length > 0 && (
            <section className="practice-history">
              <h2>{t("Your practice sessions")}</h2>
              {data.rehearsals.map((r) => (
                <button
                  className="practice-history-item"
                  disabled={busy}
                  key={r.id}
                  onClick={() => {
                    setRehearsal(r);
                    resetClock(r);
                    setIndex(0);
                    setVoice(
                      r.endedAt ||
                        practiceBudgetReached(
                          r.durationSeconds || 0,
                          r.voiceExpiresAt,
                        )
                        ? "ended"
                        : "idle",
                    );
                    setAudience(r.audience);
                    setFeedback(r.feedback);
                    setFeedbackOpen(false);
                    setRemarks(r.remarks);
                    allRemarks.current = r.remarks;
                    completedRemarks.current = [];
                  }}
                >
                  <Icon name="mic" />
                  <span>
                    <time dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleDateString(
                        locale === "en" ? "en-GB" : "tr-TR",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                      <span>
                        {new Date(r.createdAt).toLocaleTimeString(
                          locale === "en" ? "en-GB" : "tr-TR",
                          { hour: "2-digit", minute: "2-digit", hour12: false },
                        )}
                      </span>
                    </time>
                    <span className="practice-history-audience">
                      {r.audience}
                    </span>
                    <small>
                      {r.endedAt ? t("Completed") : t("Continue")}
                      {typeof r.durationSeconds === "number" && (
                        <> · {formatPracticeDuration(r.durationSeconds)}</>
                      )}
                    </small>
                  </span>
                  <Icon name="right" />
                </button>
              ))}
            </section>
          )}
        </main>
      ) : (
        <div className="practice-workspace-shell">
          <PracticeWorkspace
            key={rehearsal.id}
            course={c}
            rehearsal={rehearsal}
            voice={voice}
            slideIndex={index}
            onSlide={(next) => {
              setIndex(next);
              contextForSlide(next);
            }}
            speakingPersona={speakingPersona}
            elapsedSeconds={elapsedSeconds}
            durationKnown={durationKnown}
            micMuted={micMuted}
            onToggleMic={toggleMic}
            onStart={connect}
            onEnd={finish}
            onCancelConnect={() => {
              close();
              setVoice("idle");
              setNotice("");
            }}
            notice={notice}
            hasFeedback={!!feedback}
            onOpenFeedback={openFeedback}
            feedbackButtonRef={feedbackButton}
            recovery={
              retryLine && voice === "listening" ? (
                <div className="practice-replay">
                  <p>
                    <strong>
                      {rehearsal.personas[retryLine.personaIndex].name}:
                    </strong>{" "}
                    {retryLine.text}
                  </p>
                  <button
                    className="button"
                    onClick={() =>
                      speak(retryLine.personaIndex, retryLine.text)
                    }
                  >
                    <Icon name="play" />
                    {t("Replay participant’s line")}
                  </button>
                </div>
              ) : undefined
            }
            onNew={() => {
              close();
              resetClock();
              setRehearsal(undefined);
              setVoice("idle");
              setFeedback(undefined);
              setFeedbackOpen(false);
              setNotice("");
              setRetryLine(undefined);
            }}
            editable={editable}
            previewing={previewing}
            busy={busy}
          />
          <main className="practice-session-details">
            {voice === "feedback" && (
              <OperationProgress kind="feedback" compact />
            )}
            {feedback && (
              <PracticeFeedback
                open={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
                rehearsal={rehearsal}
                feedback={feedback}
                returnFocusRef={feedbackButton}
              />
            )}
            <details
              className="rehearsal-remarks practice-transcript"
              id="practice-comments"
              tabIndex={-1}
            >
              <summary>
                {t("Participant comments")} <span>{remarks.length}</span>
              </summary>
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
            </details>
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
          </main>
        </div>
      )}
    </div>
  );
}
