"use client";
import { isChoiceActivity } from "@/lib/activities";
import { AgentIllustration } from "./agent-identity";
import { learningAccess } from "@/lib/training-access";
import { LiveConnection } from "./live-connection";
import { useLiveResource } from "./use-live-resource";
import { unsentActivityDrafts, type ActivityDrafts } from "@/lib/live-sync";
import type { ActivityResponse } from "@/lib/types";
import { ThemeMenu } from "./theme-menu";
import { ParticipantSkeleton } from "./skeletons";
import { useProductLocale as useLocale } from "./product-locale";
import { useEffect, useId, useRef, useState } from "react";
import {
  ParticipantSourcePreview,
  type ParticipantSource,
} from "./participant-source";
import type { CourseState, User } from "@/lib/types";
import { ParticipantEntry } from "./participant-entry";
import { JoinForm } from "./dashboard";
import {
  api,
  useResource,
  Icon,
  Logo,
  Loading,
  ErrorNote,
  Empty,
  ResourceFailure,
} from "./ui";

export function Participant() {
  const { t } = useLocale();

  const auth = useResource<{ user?: User }>("participant/auth");
  const [id, setId] = useState(""),
    [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setId(p.get("training") || "");
    setCode(p.get("code") || "");
  }, []);
  useEffect(() => {
    if (auth.data?.user?.role === "participant" && code && !id) {
      let active = true;
      setJoining(true);
      setJoinError("");
      api("participant/join", { code })
        .then((r) => {
          if (active) {
            setJoining(false);
            setId(r.id);
            history.replaceState(null, "", `/join?training=${r.id}`);
          }
        })
        .catch((error: Error) => {
          if (active) setJoinError(error.message);
        })
        .finally(() => {
          if (active) setJoining(false);
        });
      return () => {
        active = false;
      };
    }
  }, [auth.data?.user?.id, auth.data?.user?.role, code, id]);
  if (!auth.data)
    return auth.error ? (
      <ResourceFailure error={auth.error} onRetry={auth.refresh} />
    ) : (
      <ParticipantSkeleton />
    );
  if (!auth.data.user)
    return (
      <ParticipantEntry
        initialCode={code}
        onSignedIn={() => {
          void auth.refresh();
        }}
        onJoin={(courseId, user) => {
          auth.setData({ user });
          setJoinError("");
          setId(courseId);
          history.replaceState(null, "", `/join?training=${courseId}`);
        }}
      />
    );
  if (!id && joining) return <Loading label={t("Joining your training…")} />;
  if (!id)
    return (
      <div className="participant-gate">
        <header>
          <Logo />
          <ThemeMenu />
        </header>
        <h1>{t("Join training")}</h1>
        <p className="muted">
          {t("Hello")} {auth.data.user.name}
          {t(". Enter the code shared by your instructor.")}
        </p>
        <ErrorNote message={joinError} />
        <JoinForm
          participantScope
          initialCode={code}
          onJoin={(id) => {
            setJoinError("");
            setJoining(false);
            setId(id);
            history.replaceState(null, "", `/join?training=${id}`);
          }}
        />
        {auth.data.user.guest && (
          <button
            className="text-button"
            onClick={async () => {
              setJoinError("");
              try {
                await api("participant/auth", undefined, "DELETE");
                await auth.refresh();
              } catch (error) {
                setJoinError((error as Error).message);
              }
            }}
          >
            {t("Change participant name")}
          </button>
        )}
        <a className="text-button" href="/">
          {t("Back to home")}
        </a>
      </div>
    );
  return (
    <ParticipantCourse
      id={id}
      user={auth.data.user}
      onLeave={() => {
        setId("");
        setCode("");
        setJoinError("");
        setJoining(false);
        history.replaceState(null, "", "/join");
      }}
    />
  );
}
function ParticipantCourse({
  id,
  user,
  onLeave,
}: {
  id: string;
  user: User;
  onLeave: () => void;
}) {
  const { t } = useLocale();

  const { data, error, refresh, setData, checking, lastUpdated } =
    useLiveResource<CourseState>(`participant/courses/${id}`, 1600);
  const [tab, setTab] = useState("chat"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [drafts, setDrafts] = useState<ActivityDrafts>({}),
    [activityNotice, setActivityNotice] = useState<{
      slideId: string;
      message: string;
    }>(),
    [sending, setSending] = useState(false),
    [source, setSource] = useState<ParticipantSource | null>(null);
  const sourceId = useId();
  const sourceButton = useRef<HTMLElement>(null);
  const sourceOpen = useRef(false);
  function closeSource() {
    sourceOpen.current = false;
    setSource(null);
  }
  const bottom = useRef<HTMLDivElement>(null),
    version = useRef(-1);
  const course = data?.course,
    active = course?.slides.find((s) => s.id === course.activeSlideId);
  useEffect(() => {
    if (!course) return;
    if (
      course.status === "live" &&
      active?.kind === "activity" &&
      course.slideVersion !== version.current
    )
      setTab("activities");
    if (course.status === "ended") setTab("chat");
    version.current = course.slideVersion;
  }, [course?.slideVersion, course?.status, active?.kind]);
  const value = active ? drafts[active.id] || "" : "";
  const setValue = (value: string) => {
    if (active) setDrafts((previous) => ({ ...previous, [active.id]: value }));
  };
  useEffect(() => {
    if (tab === "chat" && !sourceOpen.current)
      bottom.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "end",
      });
  }, [
    data?.questions.length,
    data?.questions.map((q) => q.status).join(),
    tab,
  ]);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || busy || error) return;
    setBusy(true);
    setNotice("");
    const text = message;
    setMessage("");
    try {
      await api(`participant/courses/${id}/questions`, { text });
      await refresh();
    } catch (e) {
      setNotice((e as Error).message);
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return !error ? (
      <ParticipantSkeleton />
    ) : (
      <div className="participant-gate">
        <header>
          <Logo />
          <ThemeMenu />
        </header>
        <ErrorNote message={error} />
        <button className="button" onClick={() => void refresh()}>
          {t("Try again")}
        </button>
        {error && (
          <button className="button" onClick={onLeave}>
            {t("Join another training")}
          </button>
        )}
      </div>
    );
  const c = data.course,
    ended = c.status === "ended",
    access = learningAccess(c),
    remaining = access.remainingDays,
    chatOpen = access.canAsk,
    submitted = data.responses.find((r) => r.slideId === active?.id),
    unsent = unsentActivityDrafts(c, drafts, data.responses),
    sourceQuestion = data.questions.find(
      (question) => question.id === source?.questionId,
    );
  return (
    <div className={`participant-workspace ${source ? "has-source" : ""}`}>
      <div className="participant-app">
        <header>
          <button
            className="icon-button"
            aria-label={t("Leave training")}
            onClick={onLeave}
          >
            <Icon name="back" />
          </button>
          <Logo />
          <ThemeMenu />
          <span className="avatar">{user.name.slice(0, 1)}</span>
        </header>
        <div className="participant-course-title">
          <div>
            <h1>{c.name}</h1>
            <span className="small muted">
              {c.status === "live" ? (
                <>
                  {t(
                    error
                      ? "Last known status: live training"
                      : "Live training",
                  )}
                </>
              ) : ended ? (
                access.canAsk ? (
                  t("Training completed · Learning agent access: {days} days", {
                    days: remaining,
                  })
                ) : (
                  t("Training completed · Learning agent access ended")
                )
              ) : (
                t("Waiting for your instructor")
              )}
            </span>
          </div>
        </div>
        <LiveConnection
          error={error}
          checking={checking}
          lastUpdated={lastUpdated}
          onRetry={() => void refresh()}
        />
        <nav className="participant-tabs" aria-label={t("Training sections")}>
          <button
            className={tab === "chat" ? "active" : ""}
            aria-pressed={tab === "chat"}
            onClick={() => setTab("chat")}
          >
            <Icon name="chat" />
            {t("Chat")}
          </button>
          <button
            className={tab === "activities" ? "active" : ""}
            aria-pressed={tab === "activities"}
            onClick={() => setTab("activities")}
          >
            <Icon name="activity" />
            {t("Activities")}
            {c.status === "live" && active?.kind === "activity" && <i />}
          </button>
        </nav>
        {tab === "activities" &&
          c.status === "live" &&
          active?.kind === "activity" && (
            <p className="activity-arrival" role="status">
              <Icon name="activity" size={16} />
              {t(
                "Your instructor opened an activity. Your conversation is saved.",
              )}
            </p>
          )}
        {tab === "chat" ? (
          <>
            <div className="chat-messages">
              <div className="chat-intro">
                {data.questions.length === 0 && chatOpen ? (
                  <AgentIllustration kind="learning" />
                ) : (
                  <span className="assistant-avatar">
                    <Icon name="agent" />
                  </span>
                )}
                <h2>{t("Your learning agent")}</h2>
                <p>
                  {chatOpen
                    ? t(
                        "Ask questions about this training’s document. Your answers and conversation are private.",
                      )
                    : ended
                      ? t(
                          "Your learning agent access has ended. Your previous conversation is still available.",
                        )
                      : t(
                          "You’ll be able to ask questions here when your instructor starts training.",
                        )}
                </p>
                {!c.autoAnswer && c.status === "live" && (
                  <span className="small">
                    {t(
                      "Questions in this training are forwarded directly to your instructor.",
                    )}
                  </span>
                )}
              </div>
              {data.questions.map((q) => (
                <div className="chat-exchange" key={q.id}>
                  <div className="chat-user">
                    <p>{q.text}</p>
                  </div>
                  <div
                    className={`chat-answer ${!q.answer && q.status !== "pending" ? "forward" : ""}`}
                  >
                    <span className="chat-answer-label">
                      <Icon
                        name={
                          q.answer
                            ? "agent"
                            : q.status === "pending"
                              ? "spinner"
                              : "presentation"
                        }
                        className={q.status === "pending" ? "spin" : ""}
                        size={16}
                      />
                      {q.answer
                        ? t("LİNBA agent")
                        : q.status === "pending"
                          ? t("Preparing an answer")
                          : t("Forwarded to your instructor")}
                    </span>
                    <p>
                      {q.answer ||
                        (q.status === "pending"
                          ? t("Looking for an answer in the document…")
                          : t(
                              "Your question was forwarded to the instructor.",
                            ))}
                    </p>
                    {q.answer && q.sources.length > 0 && (
                      <div className="chat-sources">
                        {q.sources.map((n) => (
                          <button
                            key={n}
                            aria-haspopup="dialog"
                            aria-expanded={
                              source?.questionId === q.id && source.page === n
                            }
                            aria-controls={sourceId}
                            onClick={(event) => {
                              sourceButton.current = event.currentTarget;
                              sourceOpen.current = true;
                              setSource({ questionId: q.id, page: n });
                            }}
                          >
                            <Icon name="file" size={14} />
                            {t("Slide")} {n}
                          </button>
                        ))}
                      </div>
                    )}
                    {q.addressed && (
                      <span className="small success-text">
                        <Icon name="check" size={14} />
                        {t("Your instructor has addressed this question.")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            <div className="chat-input-area">
              <ErrorNote message={notice} />
              <form onSubmit={ask}>
                <textarea
                  aria-label={t("Write your question")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    chatOpen
                      ? t("Ask a question about the training…")
                      : ended
                        ? t("Learning agent access has ended")
                        : t("Chat is not open yet")
                  }
                  disabled={!chatOpen}
                  rows={1}
                  maxLength={2000}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(e);
                    }
                  }}
                />
                <button
                  className="send-button"
                  disabled={!chatOpen || busy || !!error || !message.trim()}
                  aria-label={t("Send question")}
                >
                  <Icon
                    name={busy ? "spinner" : "send"}
                    className={busy ? "spin" : ""}
                  />
                </button>
              </form>
              <small>
                {t(
                  "Answers are limited to the document. Questions not covered by the source are forwarded to your instructor.",
                )}
              </small>
            </div>
          </>
        ) : (
          <div className="participant-activity">
            {c.status === "live" && active?.activity ? (
              <>
                <span className="activity-label">
                  <Icon name="activity" />
                  {t("ACTIVE ACTIVITY")}
                </span>
                <h2>{active.activity.question}</h2>
                {submitted ? (
                  <div className="submitted">
                    <Icon name="success" size={40} />
                    <h3>{t("Your answer has been submitted.")}</h3>
                    <p>{submitted.value}</p>
                    <span className="small muted">
                      {t("You can wait for your instructor’s next activity.")}
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (sending || error || !value.trim()) return;
                      const slideId = active.id;
                      const answer = value;
                      setSending(true);
                      setActivityNotice(undefined);
                      try {
                        const result = await api<{
                          response: ActivityResponse;
                        }>(`participant/courses/${id}/responses`, {
                          slideId,
                          value: answer,
                        });
                        setData((previous) =>
                          previous
                            ? {
                                ...previous,
                                responses: [
                                  ...previous.responses.filter(
                                    (response) =>
                                      response.id !== result.response.id,
                                  ),
                                  result.response,
                                ],
                              }
                            : previous,
                        );
                        setDrafts((previous) => {
                          if (previous[slideId] !== answer) return previous;
                          const next = { ...previous };
                          delete next[slideId];
                          return next;
                        });
                        await refresh();
                      } catch (e) {
                        setActivityNotice({
                          slideId,
                          message: (e as Error).message,
                        });
                        void refresh();
                      } finally {
                        setSending(false);
                      }
                    }}
                  >
                    {isChoiceActivity(active.activity.type) ? (
                      <div className="participant-options">
                        {active.activity.options.map((o, i) => (
                          <label
                            key={i}
                            className={value === o ? "selected" : ""}
                          >
                            <input
                              type="radio"
                              name="option"
                              value={o}
                              checked={value === o}
                              onChange={() => setValue(o)}
                            />
                            <span>{String.fromCharCode(65 + i)}</span>
                            {o}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <label>
                        {t("Your answer")}
                        <textarea
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={t(
                            "Share your thoughts in your own words…",
                          )}
                          rows={6}
                          maxLength={3000}
                          required
                        />
                      </label>
                    )}
                    <p className="activity-draft-hint">
                      {t(
                        "Your answer stays in this tab if your instructor changes activities.",
                      )}
                    </p>
                    <ErrorNote
                      message={
                        activityNotice?.slideId === active.id
                          ? activityNotice.message
                          : ""
                      }
                    />
                    <button
                      className="button primary full"
                      disabled={sending || !!error || !value.trim()}
                    >
                      {sending ? t("Sending…") : t("Submit answer")}
                      <Icon name="send" />
                    </button>
                  </form>
                )}
              </>
            ) : (
              <Empty
                icon="activity"
                title={
                  ended
                    ? t("Training completed")
                    : t("Wait for the next activity")
                }
                description={
                  ended
                    ? t(
                        "Your responses have been added to the instructor’s report.",
                      )
                    : t(
                        "This area opens automatically when your instructor reaches an activity slide.",
                      )
                }
              />
            )}
            {unsent.length > 0 && (
              <section
                className="unsent-activity-drafts"
                aria-label={t("Unsent answers")}
              >
                <h3>{t("Unsent answers")}</h3>
                <p>
                  {t(
                    ended
                      ? "These answers were not submitted and are not included in the report."
                      : "Kept in this tab. You can submit when your instructor reopens the activity.",
                  )}
                </p>
                {unsent.map((slide) => (
                  <details key={slide.id}>
                    <summary>
                      {slide.activity!.question}
                      <Icon name="downCaret" size={16} />
                    </summary>
                    <p>{slide.draft}</p>
                    {activityNotice?.slideId === slide.id && (
                      <ErrorNote message={activityNotice.message} />
                    )}
                  </details>
                ))}
              </section>
            )}
            <div className="previous-responses">
              {data.responses.length > 0 && (
                <h3>{t("Your submitted answers")}</h3>
              )}
              {data.responses.map((r) => (
                <div key={r.id}>
                  <span className="small muted">
                    {
                      c.slides.find((s) => s.id === r.slideId)?.activity
                        ?.question
                    }
                  </span>
                  <p>{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {source && sourceQuestion && (
        <ParticipantSourcePreview
          course={c}
          question={sourceQuestion}
          pageNumber={source.page}
          panelId={sourceId}
          onPage={(page) => setSource({ ...source, page })}
          onClose={closeSource}
          returnFocusRef={sourceButton}
        />
      )}
    </div>
  );
}
