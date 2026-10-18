"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Course, Rehearsal } from "@/lib/types";
import { assignPortraits, portraitSource } from "@/lib/agent-portraits";
import { formatPracticeDuration } from "@/lib/practice-clock";
import {
  assignVoices,
  voiceStyle,
  voicesFor,
  VOICE_STYLE_LABELS,
  type VoiceId,
  type VoiceStyle,
} from "@/lib/voices";
import { AgentMark } from "./agent-identity";
import { useLocale } from "./locale-provider";
import { SlideView, slideTitle } from "./slides";
import { Icon } from "./ui";

type Props = {
  course: Course;
  rehearsal: Rehearsal;
  voice: string;
  slideIndex: number;
  onSlide: (index: number) => void;
  speakingPersona: number | null;
  elapsedSeconds: number;
  durationKnown: boolean;
  micMuted: boolean;
  onToggleMic: () => void;
  onStart: () => void;
  onEnd: () => void;
  onNew: () => void;
  editable: boolean;
  previewing: number | null;
  editingVoice: boolean;
  busy: boolean;
  onChangeVoice: (index: number, style: VoiceStyle, voice: VoiceId) => void;
  onPreviewVoice: (index: number) => void;
};

export function PracticeWorkspace(props: Props) {
  const { t, locale } = useLocale();
  const { course, rehearsal, voice, speakingPersona, slideIndex } = props;
  const [selected, setSelected] = useState(0);
  const [fullscreenError, setFullscreenError] = useState(false);
  const room = useRef<HTMLDivElement>(null);
  const personas = assignVoices(
    assignPortraits(rehearsal.personas, rehearsal.id),
  );
  const profile = personas[selected];
  const profileSummary = profile?.background.split(/(?<=[.!?])\s/)[0];
  const connected = ["listening", "thinking", "rendering", "speaking"].includes(
    voice,
  );
  const speakingName = personas[speakingPersona ?? 0]?.name || "";
  const status =
    voice === "connecting"
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
                  : t("Your participants are ready");
  const agentStatus = (index: number) => {
    if (voice === "ended") return t("Session ended");
    if (voice === "feedback") return t("Session ended");
    if (speakingPersona === index && voice === "speaking") return t("Speaking");
    if (speakingPersona === index && voice === "rendering")
      return t("Preparing to speak");
    return connected ? t("Listening") : t("Ready");
  };
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
    <div className="practice-workbench">
      <aside className="practice-brief" aria-label={t("Practice brief")}>
        <div className="practice-section-heading">
          <AgentMark size={22} />
          <h2>{t("Your practice audience")}</h2>
          <span>{personas.length}</span>
        </div>
        <details className="practice-audience" open>
          <summary>{t("Audience brief")}</summary>
          <p>{rehearsal.audience}</p>
        </details>
        <div
          className="practice-profile-picker"
          aria-label={t("Agent profiles")}
        >
          {personas.map((persona, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={selected === index}
              aria-label={t("View {name}’s profile", { name: persona.name })}
              onClick={() => setSelected(index)}
            >
              <Image
                src={portraitSource(persona.portraitId)}
                alt=""
                width={48}
                height={48}
                unoptimized
              />
              <span>{persona.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
        {profile && (
          <section className="practice-agent-profile" aria-label={profile.name}>
            <div className="practice-profile-heading">
              <Image
                src={portraitSource(profile.portraitId)}
                alt=""
                width={88}
                height={88}
                unoptimized
              />
              <div>
                <span className="practice-eyebrow">{t("AI participant")}</span>
                <h3>{profile.name}</h3>
                <span className="practice-profile-status">
                  {agentStatus(selected)}
                </span>
              </div>
            </div>
            <p>{profileSummary}</p>
            {profile.learningGoal && (
              <dl>
                <dt>{t("Learning goal")}</dt>
                <dd>{profile.learningGoal}</dd>
              </dl>
            )}
            <details className="practice-profile-details">
              <summary>{t("Approach and prior knowledge")}</summary>
              {profile.background !== profileSummary && (
                <p>{profile.background}</p>
              )}
              {profile.priorKnowledge && <p>{profile.priorKnowledge}</p>}
              <p>{profile.behavior}</p>
              {profile.speakingStyle && <p>{profile.speakingStyle}</p>}
            </details>
            <div
              className="practice-mood"
              title={t("Emotion signals will be available when configured.")}
            >
              <span>{t("Emotion")}</span>
              <span>{t("Not available yet")}</span>
            </div>
            <details className="practice-profile-details practice-voice-settings">
              <summary>{t("Voice settings")}</summary>
              <div className="persona-voice-controls">
                <label>
                  {t("Voice style")}
                  <select
                    aria-label={t("{name} voice style", { name: profile.name })}
                    value={profile.gender}
                    disabled={!props.editable || !!rehearsal.endedAt}
                    onChange={(e) => {
                      const style = voiceStyle(e.target.value);
                      props.onChangeVoice(
                        selected,
                        style,
                        voicesFor(style)[0].id,
                      );
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
                    aria-label={t("{name} voice", { name: profile.name })}
                    value={profile.voice}
                    disabled={!props.editable || !!rehearsal.endedAt}
                    onChange={(e) =>
                      props.onChangeVoice(
                        selected,
                        voiceStyle(profile.gender),
                        e.target.value as VoiceId,
                      )
                    }
                  >
                    {voicesFor(voiceStyle(profile.gender)).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!rehearsal.endedAt && (
                  <button
                    className="button"
                    disabled={!props.editable || props.previewing !== null}
                    onClick={() => props.onPreviewVoice(selected)}
                  >
                    <Icon
                      name={props.previewing === selected ? "spinner" : "play"}
                      className={
                        props.previewing === selected ? "spin" : undefined
                      }
                    />
                    {props.previewing === selected
                      ? t("Preparing / playing…")
                      : t("Preview voice")}
                  </button>
                )}
              </div>
            </details>
          </section>
        )}
        <p className="practice-disclosure">
          {t(
            "Fictional AI participants. All agents take part; selecting a profile only changes this panel.",
          )}
        </p>
      </aside>
      <div className="practice-room" ref={room}>
        <header className="practice-room-header">
          <div>
            <span
              className={`practice-session-dot ${connected ? "is-connected" : ""}`}
              aria-hidden="true"
            />
            <strong>{t("Practice room")}</strong>
            <span className="practice-room-course">{course.name}</span>
          </div>
          <div className="practice-room-tools">
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
          aria-label={t("AI participant agents")}
        >
          {personas.map((persona, index) => (
            <button
              key={index}
              type="button"
              className={`practice-agent-tile ${speakingPersona === index && voice === "speaking" ? "is-speaking" : ""}`}
              aria-pressed={selected === index}
              aria-label={t("View {name}’s profile", { name: persona.name })}
              onClick={() => setSelected(index)}
            >
              <span className="practice-tile-portrait">
                <Image
                  src={portraitSource(persona.portraitId)}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                />
                <span>AI</span>
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
                <span className="practice-tile-mood">
                  {t("Emotion")} <span>—</span>
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
        <footer className="practice-room-controls">
          <div className="practice-connection-copy" role="status">
            <strong>{status}</strong>
            <span>
              {voice === "idle"
                ? t("Start practice and teach aloud.")
                : voice === "ended"
                  ? t("Review your feedback below.")
                  : voice === "feedback"
                    ? t("Your feedback focuses on your teaching performance.")
                    : t("Advance your slides and keep teaching naturally.")}
            </span>
          </div>
          <div className="practice-room-actions">
            {connected && (
              <button
                className={`icon-button practice-mute ${props.micMuted ? "is-muted" : ""}`}
                aria-pressed={props.micMuted}
                aria-label={
                  props.micMuted ? t("Unmute microphone") : t("Mute microphone")
                }
                title={
                  props.micMuted ? t("Unmute microphone") : t("Mute microphone")
                }
                onClick={props.onToggleMic}
              >
                <Icon name="mic" />
                {props.micMuted && (
                  <span className="practice-mute-slash" aria-hidden="true" />
                )}
              </button>
            )}
            {voice === "idle" ? (
              <button
                className="button primary"
                onClick={props.onStart}
                disabled={props.previewing !== null || props.editingVoice}
              >
                <Icon name="mic" />
                {t("Start practice")}
              </button>
            ) : voice === "ended" ? (
              <button className="button" onClick={props.onNew}>
                {t("New practice")}
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
                disabled={props.busy || voice === "connecting"}
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
    </div>
  );
}
