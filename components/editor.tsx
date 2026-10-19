"use client";
import { OperationProgress } from "./operation-progress";
import { ActivityEditor } from "./activity-editor";
import { EditableTrainingTitle, SlideNotes } from "./slide-notes";
import { RepeatTrainingButton } from "./repeat-training-button";
import { EditorSkeleton } from "./skeletons";
import { useLocale } from "./locale-provider";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { Course, CourseState } from "@/lib/types";
import {
  api,
  Icon,
  Logo,
  Modal,
  ErrorNote,
  Status,
  useResource,
  Empty,
} from "./ui";
import { SlideView, slideTitle } from "./slides";
import { SlideRail } from "./slide-rail";

export function Editor({ id, live = false }: { id: string; live?: boolean }) {
  const { t, locale } = useLocale();

  const router = useRouter(),
    resource = useResource<CourseState>(`courses/${id}`, live ? 1800 : 0),
    { data, error, setData, refresh } = resource;
  const latestData = useRef<CourseState | undefined>(data);
  latestData.current = data;
  const [add, setAdd] = useState(false),
    [edit, setEdit] = useState(false),
    [settings, setSettings] = useState(false),
    [end, setEnd] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [showJoin, setShowJoin] = useState(false),
    [joinBase, setJoinBase] = useState(""),
    [saving, setSaving] = useState(false),
    [tool, setTool] = useState<"content" | "agents" | null>(null),
    [compactTools, setCompactTools] = useState(false);
  const notesFlush = useRef<(() => Promise<void>) | null>(null);
  const toolsOpen = tool !== null;
  const toolsTrigger = useRef<HTMLButtonElement>(null);
  const toolsPanel = useRef<HTMLElement>(null);
  const activityTrigger = useRef<HTMLElement | null>(null);
  const settingsTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setCompactTools(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  function toggleTool(
    event: React.MouseEvent<HTMLButtonElement>,
    next: "content" | "agents",
  ) {
    toolsTrigger.current = event.currentTarget;
    setTool(tool === next ? null : next);
  }
  function openSettings(event: React.MouseEvent<HTMLButtonElement>) {
    settingsTrigger.current = toolsPanel.current?.contains(event.currentTarget)
      ? toolsTrigger.current
      : event.currentTarget;
    setTool(null);
    setSettings(true);
  }
  function openActivity(
    event: React.MouseEvent<HTMLButtonElement>,
    editing = false,
  ) {
    activityTrigger.current = toolsPanel.current?.contains(event.currentTarget)
      ? toolsTrigger.current
      : event.currentTarget;
    setTool(null);
    if (editing) setEdit(true);
    else setAdd(true);
  }
  useEffect(() => {
    if (!toolsOpen) return;
    toolsPanel.current
      ?.querySelector<HTMLButtonElement>(".editor-tools-close")
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTool(null);
        toolsTrigger.current?.focus();
      }
      if (event.key === "Tab" && compactTools) {
        const controls = Array.from(
          toolsPanel.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]',
          ) || [],
        ).filter((element) => element.getClientRects().length);
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsOpen, compactTools]);
  async function mutate(body: unknown) {
    setNotice("");
    setSaving(true);
    try {
      const result = await api<CourseState>(`courses/${id}`, body, "PATCH");
      setData(result);
      return result;
    } catch (e) {
      setNotice((e as Error).message);
      throw e;
    } finally {
      setSaving(false);
    }
  }
  async function select(slideId: string) {
    try {
      await mutate({ action: "select", slideId });
    } catch {}
  }
  if (!data)
    return !error ? (
      <EditorSkeleton live={live} />
    ) : (
      <div className="editor-loading">
        <a className="text-button" href="/">
          <Icon name="back" />
          {t("Back to workspace")}
        </a>
        <ErrorNote message={error} />
        <button className="button" onClick={() => void resource.refresh()}>
          {t("Try again")}
        </button>
      </div>
    );
  const c = data.course,
    active = c.slides.find((s) => s.id === c.activeSlideId) || c.slides[0],
    index = c.slides.indexOf(active),
    draft = c.status === "draft";
  async function start() {
    setBusy(true);
    try {
      await notesFlush.current?.();
      await mutate({ action: "start" });
      router.push(`/training/${id}/live`);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    setBusy(true);
    try {
      await mutate({ action: "end" });
      setEnd(false);
      router.push(`/?view=reports&report=${id}`);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function join() {
    const status = await api("status");
    setJoinBase(status.joinOrigin || window.location.origin);
    setShowJoin(true);
  }
  if (live && c.status !== "live")
    return (
      <main className="training-status-page">
        <Logo />
        <Status status={c.status} />
        <h1>
          {t(
            c.status === "draft"
              ? "Your training has not started yet"
              : "This training has ended",
          )}
        </h1>
        <p>
          {t(
            c.status === "draft"
              ? "Prepare your activities and start the session when you are ready."
              : "Review the learning report and follow-up questions.",
          )}
        </p>
        <a
          className="button primary"
          href={
            c.status === "draft"
              ? `/training/${id}`
              : `/?view=reports&report=${id}`
          }
        >
          {t(
            c.status === "draft"
              ? "Return to preparation"
              : "View learning report",
          )}
          <Icon name="arrow" />
        </a>
      </main>
    );
  return (
    <div
      className={`editor-shell ${live ? "live-shell" : ""} ${toolsOpen ? "tools-open" : ""}`}
    >
      <header className="editor-header">
        <button
          className="icon-button"
          aria-label={t("Back to my training")}
          onClick={() => router.push("/?view=courses")}
        >
          <Icon name="back" />
        </button>
        <div className="editor-name">
          <EditableTrainingTitle
            name={c.name}
            onSave={async (name) => {
              const result = await api<CourseState>(
                `courses/${id}`,
                { action: "rename", name },
                "PATCH",
              );
              const current = latestData.current;
              if (current)
                setData({
                  ...current,
                  course: { ...current.course, name: result.course.name },
                });
            }}
          />
          {saving ? (
            <span className="small muted" role="status">
              <Icon name="spinner" size={14} className="spin" />
              {t("Saving…")}
            </span>
          ) : live ? (
            <span className="small muted">{t("Instructor controls")}</span>
          ) : null}
        </div>
        <Status status={c.status} />
        <div className="editor-header-actions">
          {live ? (
            <>
              <button className="button" onClick={join}>
                <Icon name="users" />
                {t("Join")}
              </button>
              <a
                className="button"
                href={`/present/${id}?key=${c.displayKey}`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="monitor" />
                {t("Present")}
              </a>
              {c.status === "live" && (
                <button className="button danger" onClick={() => setEnd(true)}>
                  <Icon name="stop" />
                  {t("End training")}
                </button>
              )}
            </>
          ) : (
            <>
              {draft ? (
                <button className="button mint" disabled={busy} onClick={start}>
                  <Icon name="play" />
                  {t("Start training")}
                </button>
              ) : c.status === "live" ? (
                <button
                  className="button mint"
                  onClick={() => router.push(`/training/${id}/live`)}
                >
                  <Icon name="play" />
                  {t("Back to live training")}
                </button>
              ) : (
                <>
                  <RepeatTrainingButton
                    id={id}
                    beforeRepeat={() =>
                      notesFlush.current?.() || Promise.resolve()
                    }
                  />
                  <button
                    className="button report"
                    onClick={() => router.push(`/?view=reports&report=${id}`)}
                  >
                    <Icon name="chart" />
                    {t("Open report")}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>
      <SlideRail
        course={c}
        editable={draft && !live}
        disabled={saving || busy}
        onAdd={openActivity}
        onSelect={select}
        onReorder={async (ids) => {
          await mutate({ action: "reorder", ids });
        }}
      />
      <main className="editor-stage">
        <div className="stage-top">
          <span>
            {live ? (
              <>
                <span className="live-dot" />
                {t("Participants can see this slide")}
              </>
            ) : (
              t("PRESENTATION WORKSPACE")
            )}
          </span>
          <span>
            {live
              ? t("{count} participants", { count: data.participants.length })
              : c.originalName}
          </span>
        </div>
        <div className="presentation-canvas">
          <div className="canvas-join">
            <span>
              {t("Join code:")} <strong>{c.code}</strong>
            </span>
            <Logo />
          </div>
          <SlideView course={c} slide={active} />
        </div>
        <div className="slide-controls">
          <button
            className="icon-button"
            disabled={index === 0}
            aria-label={t("Previous slide")}
            onClick={() => select(c.slides[index - 1].id)}
          >
            <Icon name="left" />
          </button>
          <span>
            <strong>{index + 1}</strong> / {c.slides.length}
          </span>
          <button
            className="icon-button"
            disabled={index === c.slides.length - 1}
            aria-label={t("Next slide")}
            onClick={() => select(c.slides[index + 1].id)}
          >
            <Icon name="right" />
          </button>
        </div>
        <ErrorNote message={notice || error} />
        {live && (
          <div className="live-status-strip">
            <span>
              <Icon name="chat" />
              {data.questions.length} {t("questions")}
            </span>
            <span>
              <Icon name="activity" />
              {
                data.responses.filter((r) => r.slideId === active.id).length
              }{" "}
              {t("activity responses")}
            </span>
            <span>
              {c.autoAnswer
                ? t("AI answers automatically")
                : t("Questions are forwarded to you")}
            </span>
          </div>
        )}
        <SlideNotes courseId={id} slide={active} flushRef={notesFlush} />
      </main>
      {!live && (
        <nav className="editor-tool-dock" aria-label={t("Training tools")}>
          <div className="editor-tool-group">
            <button
              type="button"
              aria-expanded={tool === "content"}
              aria-controls="training-tools"
              onClick={(event) => toggleTool(event, "content")}
            >
              <Icon name="presentation" size={23} />
              <span>{t("Content")}</span>
            </button>
            <button type="button" disabled={!draft} onClick={openActivity}>
              <Icon name="plus" size={23} />
              <span>{t("Activities")}</span>
            </button>
            <button
              type="button"
              aria-expanded={tool === "agents"}
              aria-controls="training-tools"
              onClick={(event) => toggleTool(event, "agents")}
            >
              <Icon name="agent" size={23} />
              <span>{t("Agents")}</span>
            </button>
          </div>
          <div className="editor-tool-group">
            <button
              type="button"
              onClick={() => router.push(`/training/${id}/practice`)}
            >
              <Icon name="mic" size={23} />
              <span>{t("Practice")}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/training/${id}/preview`)}
            >
              <Icon name="eye" size={23} />
              <span>{t("Preview")}</span>
            </button>
          </div>
          <div className="editor-tool-group editor-tool-bottom">
            <button type="button" onClick={openSettings}>
              <Icon name="settings" size={23} />
              <span>{t("Settings")}</span>
            </button>
          </div>
        </nav>
      )}
      {toolsOpen && compactTools && (
        <button
          className="editor-tools-overlay"
          aria-label={t("Close training tools")}
          onClick={() => {
            setTool(null);
            toolsTrigger.current?.focus();
          }}
        />
      )}
      {(live || toolsOpen) && (
        <aside
          ref={toolsPanel}
          id="training-tools"
          role={toolsOpen ? "dialog" : undefined}
          aria-modal={(toolsOpen && compactTools) || undefined}
          aria-label={t(
            live
              ? "Instructor controls"
              : tool === "agents"
                ? "Agents"
                : "Content",
          )}
          className={`editor-tools ${live ? "questions-panel" : "editor-context-panel"}`}
        >
          {live ? (
            <QuestionPanel
              data={data}
              onAddress={async (questionId, value) => {
                try {
                  await mutate({ action: "addressed", questionId, value });
                } catch {}
              }}
            />
          ) : (
            <>
              <header className="editor-context-heading">
                <h2>{t(tool === "agents" ? "Agents" : "Content")}</h2>
                <button
                  className="icon-button editor-tools-close"
                  aria-label={t("Close training tools")}
                  onClick={() => {
                    setTool(null);
                    toolsTrigger.current?.focus();
                  }}
                >
                  <Icon name="close" size={19} />
                </button>
              </header>
              {tool === "agents" ? (
                <div className="editor-context-body">
                  <div className="editor-context-agent">
                    <Icon name="agent" size={28} />
                    <h3>{t("Learning agent")}</h3>
                  </div>
                  <p className="muted">
                    {t(
                      "Your learning agent answers from the training materials and links to the source.",
                    )}
                  </p>
                  {c.pages.every((p) => !p.text.trim()) && (
                    <ErrorNote
                      message={t(
                        "No readable text was found in this file. The learning agent will forward questions to the instructor.",
                      )}
                    />
                  )}
                  <dl className="editor-agent-settings">
                    <div>
                      <dt>{t("Learning agent access after training")}</dt>
                      <dd>
                        {c.accessDays} {t("days")}
                      </dd>
                    </div>
                    <div>
                      <dt>{t("Live answers")}</dt>
                      <dd>
                        {c.autoAnswer ? t("Automatic") : t("Instructor review")}
                      </dd>
                    </div>
                  </dl>
                  <button className="button full" onClick={openSettings}>
                    <Icon name="settings" size={18} />
                    {t("Training settings")}
                  </button>
                </div>
              ) : (
                <div className="editor-context-body">
                  <span className="editor-context-label">
                    {t("Slide")} {index + 1} / {c.slides.length}
                  </span>
                  <h3>{slideTitle(c, active, locale)}</h3>
                  {active.kind === "document" ? (
                    <>
                      <p className="muted">
                        {t(
                          "The original presentation is preserved. You can add an activity after this slide.",
                        )}
                      </p>
                      <button
                        className="button full"
                        disabled={!draft}
                        onClick={openActivity}
                      >
                        <Icon name="plus" />
                        {t("Add activity")}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="muted">
                        {t(
                          active.activity?.type === "poll"
                            ? "Poll"
                            : active.activity?.type === "scenario"
                              ? "Scenario"
                              : "Open question",
                        )}
                      </p>
                      {active.activity?.aiGenerated && (
                        <span className="ai-label">
                          <Icon name="agent" size={16} />
                          {t("Generated with AI")}
                        </span>
                      )}
                      <button
                        className="button full"
                        disabled={!draft}
                        onClick={(event) => openActivity(event, true)}
                      >
                        {t("Edit activity")}
                      </button>
                      {draft && (
                        <button
                          className="text-button danger-text"
                          onClick={async () => {
                            try {
                              await mutate({
                                action: "remove-activity",
                                slideId: active.id,
                              });
                            } catch {}
                          }}
                        >
                          <Icon name="trash" />
                          {t("Remove activity")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </aside>
      )}
      {add && (
        <ActivityEditor
          course={c}
          returnFocusRef={activityTrigger}
          open
          onClose={() => setAdd(false)}
          onSave={async (activity) => {
            await mutate({
              action: "add-activity",
              afterId: active.id,
              activity,
            });
          }}
        />
      )}
      {edit && (
        <ActivityEditor
          key={active.id}
          returnFocusRef={activityTrigger}
          course={c}
          slide={active}
          open
          onClose={() => setEdit(false)}
          onSave={async (activity) => {
            await mutate({
              action: "update-activity",
              slideId: active.id,
              activity,
            });
          }}
        />
      )}
      {settings && (
        <Settings
          returnFocusRef={settingsTrigger}
          course={c}
          onClose={() => setSettings(false)}
          onSave={async (body) => {
            await mutate({ action: "settings", ...body });
            setSettings(false);
          }}
        />
      )}
      <Modal
        open={end}
        onClose={() => !busy && setEnd(false)}
        closeDisabled={busy}
        title={t("End training")}
        description={t(
          "Live activities will close. Participants can use the learning agent for {days} more days.",
          { days: c.accessDays },
        )}
      >
        <p hidden={busy}>
          {t(
            "This session’s records will be saved in its report. You can use the same training again with a new group.",
          )}
        </p>
        {busy && <OperationProgress kind="report" />}
        <ErrorNote message={notice} />
        <div className="modal-actions" hidden={busy}>
          <button
            className="button"
            onClick={() => setEnd(false)}
            disabled={busy}
          >
            {t("Cancel")}
          </button>
          <button className="button danger" onClick={finish} disabled={busy}>
            {t("End training")}
          </button>
        </div>
      </Modal>
      <Modal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        title={t("Join your training")}
        description={t(
          "Participants can sign in with their own accounts and join using this code.",
        )}
      >
        <div className="join-share">
          <QRCodeSVG value={`${joinBase}/join?code=${c.code}`} size={170} />
          <strong>{c.code}</strong>
          <span>{joinBase}/join</span>
          <p className="small muted">
            {t(
              "The phone and computer must be connected to the same Wi-Fi network.",
            )}
          </p>
          <button
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${joinBase}/join?code=${c.code}`,
                );
                setNotice(t("Join link copied."));
              } catch {
                setNotice(t("You can copy the link from the address above."));
              }
            }}
          >
            <Icon name="link" />
            {t("Copy link")}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Settings({
  course: c,
  onClose,
  onSave,
  returnFocusRef,
}: {
  course: Course;
  onClose: () => void;
  onSave: (body: object) => Promise<void>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();

  const [name, setName] = useState(c.name),
    [days, setDays] = useState(c.accessDays),
    [auto, setAuto] = useState(c.autoAnswer),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      open
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t("Training settings")}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({ name, accessDays: days, autoAnswer: auto });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t("Training name")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </label>
        <label>
          {t("Assistant access after training")}
          <div className="input-unit">
            <input
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
            <span>{t("days")}</span>
          </div>
          <small>{t("Starts when training ends.")}</small>
        </label>
        <label className="toggle-field">
          <span>
            <strong>{t("Automatic AI answers during live training")}</strong>
            <small>
              {t("When off, questions are forwarded directly to you.")}
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
        </label>
        <ErrorNote message={error} />
        <div className="modal-actions">
          <button className="button primary" disabled={busy}>
            {t("Save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function QuestionPanel({
  data,
  onAddress,
}: {
  data: CourseState;
  onAddress: (id: string, value: boolean) => Promise<void>;
}) {
  const { t } = useLocale();

  const [filter, setFilter] = useState("all");
  const questions = data.questions.filter(
      (q) =>
        filter === "all" ||
        ((q.status === "escalated" || q.status === "manual") && !q.addressed),
    ),
    groups = [
      ...new Map(questions.map((q) => [q.groupId, q.groupTitle])).entries(),
    ];
  return (
    <>
      <div className="tool-title">
        <h2>{t("Participant questions")}</h2>
        <span className="count">{data.questions.length}</span>
      </div>
      <div className="segmented compact">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          {t("All")}
        </button>
        <button
          className={filter === "teacher" ? "active" : ""}
          onClick={() => setFilter("teacher")}
        >
          {t("Forwarded to you")}
        </button>
      </div>
      <p className="small muted">
        {t(
          "Similar questions are grouped. Answers are visible only to the participant who asked.",
        )}
      </p>
      {groups.length ? (
        groups.map(([id, title]) => (
          <details
            className="question-group"
            key={id}
            open={filter === "teacher"}
          >
            <summary>
              {title}
              <span>{questions.filter((q) => q.groupId === id).length}</span>
            </summary>
            {questions
              .filter((q) => q.groupId === id)
              .map((q) => (
                <div className="question-record" key={q.id}>
                  <span className="small muted">{q.userName}</span>
                  <strong>{q.text}</strong>
                  {q.answer ? (
                    <>
                      <p>{q.answer}</p>
                      <span className="source">
                        {t("AI · Slide")} {q.sources.join(", ")}
                      </span>
                    </>
                  ) : (
                    <>
                      <p
                        className={
                          q.status === "pending" ? "muted" : "forwarded"
                        }
                      >
                        {q.status === "pending"
                          ? t("Preparing the AI answer…")
                          : q.status === "manual"
                            ? t("Sent directly to you.")
                            : q.reason}
                      </p>
                      {q.status !== "pending" && (
                        <button
                          className={`text-button ${q.addressed ? "success-text" : ""}`}
                          onClick={() => onAddress(q.id, !q.addressed)}
                        >
                          <Icon name="check" size={16} />
                          {q.addressed
                            ? t("Addressed")
                            : t("Mark as addressed")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
          </details>
        ))
      ) : (
        <Empty
          icon="chat"
          title={
            filter === "all"
              ? t("Questions will appear here")
              : t("No pending questions")
          }
          description={
            filter === "all"
              ? t(
                  "Follow answers here when participants ask questions in chat.",
                )
              : t(
                  "Unanswered questions and those addressed to you appear here.",
                )
          }
        />
      )}
    </>
  );
}
