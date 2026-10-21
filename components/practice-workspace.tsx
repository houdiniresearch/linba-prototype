"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Course, Rehearsal } from "@/lib/types";
import { assignPortraits, portraitSource } from "@/lib/agent-portraits";
import { formatPracticeDuration } from "@/lib/practice-clock";
import { assignVoices } from "@/lib/voices";
import { personaDescription } from "@/lib/practice-description";
import {
  practiceAgentStatus,
  practiceIsConnected,
  type PracticeVoiceState,
} from "@/lib/practice-state";
import { useProductLocale as useLocale } from "./product-locale";
import { SlideView, slideTitle } from "./slides";
import { ErrorNote, Icon } from "./ui";

type Props = {
  course: Course;
  rehearsal: Rehearsal;
  voice: PracticeVoiceState;
  slideIndex: number;
  onSlide: (index: number) => void;
  speakingPersona: number | null;
  elapsedSeconds: number;
  durationKnown: boolean;
  micMuted: boolean;
  onToggleMic: () => void;
  onStart: () => void;
  onEnd: () => void;
  onCancelConnect: () => void;
  notice?: string;
  recovery?: ReactNode;
  hasFeedback: boolean;
  onOpenFeedback: () => void;
  feedbackButtonRef: RefObject<HTMLButtonElement | null>;
  onNew: () => void;
  editable: boolean;
  previewing: number | null;
  busy: boolean;
};

export function PracticeWorkspace(props: Props) {
  const { t, locale } = useLocale();
  const { course, rehearsal, voice, speakingPersona, slideIndex } = props;
  const [selected, setSelected] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const profileId = useId();
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 850px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  function openProfile(index: number, trigger: HTMLButtonElement) {
    returnFocus.current = trigger;
    setSelected(index);
    setProfileOpen(true);
  }
  const [fullscreenError, setFullscreenError] = useState(false);
  const room = useRef<HTMLDivElement>(null);
  const personas = assignVoices(
    assignPortraits(rehearsal.personas, rehearsal.id),
  );
  const profile = personas[selected];
  const profileSummary = profile ? personaDescription(profile.background) : "";
  const connected = practiceIsConnected(voice);
  const speakingName = personas[speakingPersona ?? 0]?.name || "";
  const status =
    props.previewing !== null
      ? t("Previewing {name}’s voice", {
          name: personas[props.previewing]?.name || "",
        })
      : voice === "connecting"
        ? t("Connecting audio…")
        : voice === "rendering"
          ? t("{name} is about to speak…", { name: speakingName })
          : voice === "speaking"
            ? t("{name} is speaking", { name: speakingName })
            : voice === "thinking"
              ? t("Participants are thinking")
              : voice === "listening"
                ? props.micMuted
                  ? t("Your microphone is muted")
                  : t("They’re listening")
                : voice === "feedback"
                  ? t("Reviewing practice…")
                  : voice === "ended"
                    ? t("Practice completed")
                    : voice === "disconnected"
                      ? t("Audio disconnected")
                      : t("Your participants are ready");
  const hint =
    voice === "idle"
      ? props.previewing !== null
        ? t("Voice preview only. Your microphone is off.")
        : t("Your microphone turns on when you start.")
      : voice === "connecting"
        ? t("Allow microphone access to connect to your agents.")
        : voice === "disconnected"
          ? t("Your slides and comments are still here. Reconnect when ready.")
          : voice === "ended"
            ? props.hasFeedback
              ? t("Your feedback and participant comments are ready to review.")
              : t("Review the participant comments from this practice.")
            : voice === "feedback"
              ? t(
                  "Your microphone is off. Preparing feedback from this practice.",
                )
              : props.micMuted
                ? t("Agents cannot hear you while your microphone is off.")
                : t("Advance your slides and keep teaching naturally.");
  const agentStatus = (index: number) =>
    t(practiceAgentStatus(voice, index, speakingPersona, props.micMuted));
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await room.current?.requestFullscreen();
      setFullscreenError(false);
    } catch {
      setFullscreenError(true);
    }
  }
  return (
    <div
      className={`practice-workbench ${profileOpen && !compact ? "has-profile" : ""}`}
      ref={room}
    >
      <div className="practice-room">
        <header className="practice-room-header">
          <div>
            <span
              className={`practice-session-dot ${connected ? "is-connected" : ""}`}
              aria-hidden="true"
            />
            <div className="practice-room-title">
              <h2>{t("Practice room")}</h2>
              <span>
                {t("{count} AI participants", { count: personas.length })}
              </span>
            </div>
          </div>
          <div className="practice-room-tools">
            <button
              type="button"
              className="button practice-details-toggle"
              aria-label={t("Practice details")}
              aria-expanded={profileOpen}
              aria-controls={profileId}
              onClick={(event) => {
                if (profileOpen) setProfileOpen(false);
                else openProfile(selected, event.currentTarget);
              }}
            >
              <Icon name="users" size={18} />
              <span>{t("Practice details")}</span>
            </button>
            <span
              className="practice-timer"
              role="timer"
              aria-live="off"
              aria-label={t("Practice duration")}
              title={
                props.durationKnown
                  ? t("Connected practice time")
                  : t("Duration was not recorded for this session.")
              }
            >
              <Icon name="clock" size={17} />
              {props.durationKnown
                ? formatPracticeDuration(props.elapsedSeconds)
                : "—"}
            </span>
            <button
              className="icon-button"
              onClick={toggleFullscreen}
              aria-label={t("Toggle full screen")}
            >
              <Icon name="expand" size={19} />
            </button>
          </div>
        </header>
        <div
          className="practice-agent-strip"
          aria-label={t("AI rehearsal agents")}
        >
          {personas.map((persona, index) => (
            <button
              key={index}
              type="button"
              className={`practice-agent-tile ${speakingPersona === index && voice === "speaking" ? "is-speaking" : ""}`}
              aria-expanded={profileOpen && selected === index}
              aria-controls={profileId}
              aria-label={t("View {name}’s profile", { name: persona.name })}
              onClick={(event) => openProfile(index, event.currentTarget)}
            >
              <span className="practice-tile-portrait">
                <Image
                  src={portraitSource(persona.portraitId)}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                />
              </span>
              <span className="practice-tile-copy">
                <strong>{persona.name}</strong>
                <span className="practice-agent-state">
                  {speakingPersona === index && voice === "speaking" && (
                    <span className="practice-speaking-bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  {agentStatus(index)}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="practice-slide-stage">
          {course.slides[slideIndex] ? (
            <SlideView course={course} slide={course.slides[slideIndex]} />
          ) : (
            <p>{t("No training slides available.")}</p>
          )}
        </div>
        <div className="practice-slide-navigation">
          <p>
            {course.slides[slideIndex] &&
              slideTitle(course, course.slides[slideIndex], locale)}
          </p>
          <nav aria-label={t("Slide navigation")}>
            <button
              className="icon-button"
              disabled={slideIndex === 0}
              aria-label={t("Previous slide")}
              onClick={() => props.onSlide(slideIndex - 1)}
            >
              <Icon name="left" />
            </button>
            <span>
              {slideIndex + 1}
              <span> / {course.slides.length}</span>
            </span>
            <button
              className="icon-button"
              disabled={slideIndex >= course.slides.length - 1}
              aria-label={t("Next slide")}
              onClick={() => props.onSlide(slideIndex + 1)}
            >
              <Icon name="right" />
            </button>
          </nav>
        </div>
        {(props.notice || props.recovery) && (
          <div className="practice-room-notice">
            <ErrorNote message={props.notice} />
            {props.recovery}
          </div>
        )}
        <footer className="practice-room-controls">
          <div className="practice-connection-copy" role="status">
            <strong>{status}</strong>
            <span>{hint}</span>
          </div>
          <div className="practice-room-actions">
            {connected && (
              <button
                className={`button practice-mute ${props.micMuted ? "is-muted" : ""}`}
                aria-pressed={props.micMuted}
                aria-label={
                  props.micMuted ? t("Unmute microphone") : t("Mute microphone")
                }
                title={
                  props.micMuted ? t("Unmute microphone") : t("Mute microphone")
                }
                onClick={props.onToggleMic}
              >
                <span className="practice-mic-icon">
                  <Icon name="mic" />
                  {props.micMuted && (
                    <span className="practice-mute-slash" aria-hidden="true" />
                  )}
                </span>
                {props.micMuted ? t("Microphone off") : t("Microphone on")}
              </button>
            )}
            {voice === "idle" || voice === "disconnected" ? (
              <button
                className="button primary"
                onClick={props.onStart}
                disabled={props.previewing !== null}
              >
                <Icon name="mic" />
                {voice === "disconnected"
                  ? t("Reconnect")
                  : t("Start practice")}
              </button>
            ) : voice === "ended" ? (
              <>
                {props.hasFeedback ? (
                  <button
                    className="button"
                    onClick={props.onOpenFeedback}
                    ref={props.feedbackButtonRef}
                  >
                    {t("View feedback")}
                  </button>
                ) : (
                  <a
                    className="button"
                    href="#practice-comments"
                    onClick={() => {
                      const comments =
                        document.querySelector<HTMLDetailsElement>(
                          "#practice-comments",
                        );
                      if (comments) comments.open = true;
                    }}
                  >
                    {t("View comments")}
                  </a>
                )}
                <button className="button primary" onClick={props.onNew}>
                  {t("New practice")}
                </button>
              </>
            ) : voice === "connecting" ? (
              <button className="button" onClick={props.onCancelConnect}>
                {t("Cancel connection")}
              </button>
            ) : voice === "feedback" ? (
              <span className="practice-finishing">
                <Icon name="spinner" className="spin" />
                {t("Preparing feedback")}
              </span>
            ) : (
              <button
                className="button practice-end"
                onClick={props.onEnd}
                disabled={props.busy}
              >
                <Icon name="stop" />
                {t("End practice")}
              </button>
            )}
          </div>
        </footer>
        {fullscreenError && (
          <p role="alert" className="practice-fullscreen-error">
            {t("Full screen is unavailable in this browser.")}
          </p>
        )}
      </div>
      <Dialog.Root
        open={profileOpen}
        modal={compact}
        onOpenChange={setProfileOpen}
      >
        {compact && <Dialog.Overlay className="practice-profile-overlay" />}
        <Dialog.Content
          id={profileId}
          className="practice-brief"
          aria-describedby={undefined}
          aria-modal={compact || undefined}
          onInteractOutside={(event) => {
            if (!compact) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
          }}
        >
          <div className="practice-panel-heading">
            <Dialog.Title>{t("Practice details")}</Dialog.Title>
            <Dialog.Close
              className="icon-button"
              aria-label={t("Close practice details")}
            >
              <Icon name="close" />
            </Dialog.Close>
          </div>
          <div className="practice-panel-content">
            {profile && (
              <section
                className="practice-agent-profile"
                aria-label={profile.name}
                key={selected}
              >
                <div className="practice-profile-heading">
                  <Image
                    src={portraitSource(profile.portraitId)}
                    alt=""
                    width={88}
                    height={88}
                    unoptimized
                  />
                  <div>
                    <span className="practice-profile-kind">
                      {t("AI participant")}
                    </span>
                    <h3>{profile.name}</h3>
                    <span className="practice-profile-status">
                      {agentStatus(selected)}
                    </span>
                  </div>
                </div>
                <p>{profileSummary}</p>
              </section>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
