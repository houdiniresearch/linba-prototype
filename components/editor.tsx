"use client";
import { RouteProgress, useWorkspaceNavigation } from "./route-progress";
import { activityTypeLabel } from "@/lib/activities";
import { AccessDurationSelect } from "./access-duration-select";
import type { TeamState } from "@/lib/teams";
import {
  TeamHeader,
  CreateTeamDialog,
  InviteTeamDialog,
} from "./team-workspace";
import { LiveConnection } from "./live-connection";
import { useLiveResource } from "./use-live-resource";
import { OperationProgress } from "./operation-progress";
import { ActivityEditor } from "./activity-editor";
import { EditableTrainingTitle, SlideNotes } from "./slide-notes";
import { AgentMark } from "./agent-identity";
import { LiveElapsedTime, PresentationAgents } from "./presentation-agents";
import { LiveAssistant } from "./live-assistant";
import { EditorSkeleton } from "./skeletons";
import { useProductLocale as useLocale } from "./product-locale";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { Course, CourseState, User } from "@/lib/types";
import {
  api,
  Icon,
  Logo,
  Modal,
  ErrorNote,
  ResourceFailure,
  useResource,
  Empty,
} from "./ui";
import { SlideView, slideTitle } from "./slides";
import { SlideRail } from "./slide-rail";

export function Editor({ id, live = false }: { id: string; live?: boolean }) {
  const { t, locale } = useLocale();

  const router = useRouter();
  const { pending: navigating, navigate } = useWorkspaceNavigation();
  const auth = useResource<{ user?: User }>("auth");
  const team = useResource<TeamState>(
    `team?account=${auth.data?.user?.id || ""}`,
    10000,
    !live && auth.data?.user?.role === "teacher",
  );
  const [createTeamOpen, setCreateTeamOpen] = useState(false),
    [inviteTeamOpen, setInviteTeamOpen] = useState(false);
  const teamTrigger = useRef<HTMLElement | null>(null);
  function inviteTeam(trigger: HTMLElement) {
    teamTrigger.current = trigger;
    if (team.data?.team) setInviteTeamOpen(true);
    else setCreateTeamOpen(true);
  }
  const draftResource = useResource<CourseState>(`courses/${id}`, 0, !live);
  const liveResource = useLiveResource<CourseState>(
    `courses/${id}`,
    1800,
    live,
  );
  const resource = live ? liveResource : draftResource;
  const { data, error, setData, refresh } = resource;
  const [workspaceFailure, setWorkspaceFailure] = useState("");
  const [workspaceRequest, setWorkspaceRequest] = useState(0);
  useEffect(() => {
    if (data?.course.status !== "ended") return;
    if (live) {
      router.replace(`/?view=reports&report=${id}`);
      return;
    }
    let current = true;
    setWorkspaceFailure("");
    api<{ course: Course }>(`courses/${id}/workspace`, {})
      .then(({ course }) => {
        if (current)
          router.replace(
            `/training/${course.id}${course.status === "live" ? "/live" : ""}`,
          );
      })
      .catch((failure) => {
        if (current) setWorkspaceFailure((failure as Error).message);
      });
    return () => {
      current = false;
    };
  }, [id, live, data?.course.status, router, workspaceRequest]);
  const [optimisticSlide, setOptimisticSlide] = useState<string>();
  const [draftSlide, setDraftSlide] = useState<{
    courseId: string;
    slideId: string;
  }>();
  useEffect(() => {
    try {
      const slideId = sessionStorage.getItem(`linba:draft-slide:${id}`);
      setDraftSlide(slideId ? { courseId: id, slideId } : undefined);
    } catch {
      setDraftSlide(undefined);
    }
  }, [id]);
  const selectionTail = useRef<Promise<void>>(Promise.resolve());
  const selectionSequence = useRef(0);
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
    settingsTrigger.current =
      !live && toolsPanel.current?.contains(event.currentTarget)
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
    if (live && error)
      throw new Error("Reconnect before changing the live training.");
    await selectionTail.current;
    setNotice("");
    setSaving(true);
    try {
      const result = await api<CourseState>(`courses/${id}`, body, "PATCH");
      const action = (body as { action?: string }).action;
      if (
        result.course.status === "draft" &&
        (action === "add-activity" ||
          (draftSlide?.courseId === id &&
            !result.course.slides.some(
              (slide) => slide.id === draftSlide.slideId,
            )))
      ) {
        const slideId = result.course.activeSlideId;
        setDraftSlide({ courseId: id, slideId });
        try {
          sessionStorage.setItem(`linba:draft-slide:${id}`, slideId);
        } catch {}
      }
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
    if (!latestData.current || (live && error)) return;
    if (latestData.current.course.status === "draft") {
      // A private editor cursor is navigation, not a shared presentation edit.
      setDraftSlide({ courseId: id, slideId });
      try {
        sessionStorage.setItem(`linba:draft-slide:${id}`, slideId);
      } catch {}
      return;
    }
    if (latestData.current.course.activeSlideId === slideId && !optimisticSlide)
      return;
    const sequence = ++selectionSequence.current;
    setOptimisticSlide(slideId);
    setNotice("");
    // Serialize writes; rapid navigation coalesces to the newest requested slide.
    const job = selectionTail.current.then(async () => {
      if (sequence !== selectionSequence.current) return;
      try {
        const result = await api<{
          activeSlideId: string;
          slideVersion: number;
        }>(
          `courses/${id}`,
          { action: "select", slideId, compact: true },
          "PATCH",
        );
        if (sequence === selectionSequence.current) {
          const current = latestData.current;
          if (current)
            setData({ ...current, course: { ...current.course, ...result } });
          setOptimisticSlide(undefined);
        }
      } catch (failure) {
        if (sequence === selectionSequence.current) {
          setOptimisticSlide(undefined);
          setNotice((failure as Error).message);
          await refresh();
        }
      }
    });
    selectionTail.current = job;
    await job;
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
  if (data.course.status === "ended")
    return workspaceFailure ? (
      <main className="editor-loading">
        <a className="text-button" href="/?view=courses">
          <Icon name="back" />
          {t("Back to my presentations")}
        </a>
        <ResourceFailure
          error={workspaceFailure}
          onRetry={() => setWorkspaceRequest((value) => value + 1)}
        />
      </main>
    ) : (
      <EditorSkeleton live={false} />
    );
  const selectedSlide =
    data.course.status === "draft" && draftSlide?.courseId === id
      ? draftSlide.slideId
      : optimisticSlide;
  const c =
      selectedSlide &&
      data.course.slides.some((slide) => slide.id === selectedSlide)
        ? { ...data.course, activeSlideId: selectedSlide }
        : data.course,
    active = c.slides.find((s) => s.id === c.activeSlideId) || c.slides[0],
    index = c.slides.indexOf(active),
    draft = c.status === "draft";
  async function openPractice() {
    if (busy || saving) return;
    setBusy(true);
    try {
      await notesFlush.current?.();
      navigate(`/training/${id}/practice`);
    } catch {
      // SlideNotes keeps the save error and retry action visible.
    } finally {
      setBusy(false);
    }
  }
  async function openPreview() {
    if (busy || saving) return;
    setBusy(true);
    try {
      await notesFlush.current?.();
      navigate(`/training/${id}/preview`);
    } catch {
      // Keep unsaved notes and their retry action in the editor.
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setBusy(true);
    try {
      await notesFlush.current?.();
      await mutate({ action: "start" });
      navigate(`/training/${id}/live`);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    setBusy(true);
    try {
      await notesFlush.current?.();
      await mutate({ action: "end" });
      setEnd(false);
      navigate(`/?view=reports&report=${id}`);
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
        <h1>{t("Your training has not started yet")}</h1>
        <p>
          {t(
            "Prepare your activities and start the session when you are ready.",
          )}
        </p>
        <a className="button primary" href={`/training/${id}`}>
          {t("Return to preparation")}
          <Icon name="arrow" />
        </a>
      </main>
    );
  return (
    <div
      className={`editor-shell ${live ? "live-shell" : ""} ${toolsOpen ? "tools-open" : ""}`}
    >
      <RouteProgress pending={navigating} />
      <header className="editor-header">
        <button
          className="icon-button"
          aria-label={t("Back to my training")}
          onClick={() => navigate("/?view=courses")}
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
        <div className="editor-header-actions">
          {!live && auth.data?.user && (
            <TeamHeader
              data={team.data}
              user={auth.data.user}
              onOpen={() =>
                team.data?.team
                  ? navigate("/?view=team")
                  : inviteTeam(document.activeElement as HTMLElement)
              }
              onInvite={inviteTeam}
            />
          )}

          {live ? (
            <>
              <div className="presentation-timer" data-paused={!!c.pausedAt}>
                <LiveElapsedTime course={c} />
                <button
                  className="presentation-pause-button"
                  disabled={saving || busy || !!error}
                  aria-label={t(
                    c.pausedAt ? "Resume presentation" : "Pause presentation",
                  )}
                  title={t(
                    c.pausedAt ? "Resume presentation" : "Pause presentation",
                  )}
                  onClick={() =>
                    void mutate({
                      action: c.pausedAt ? "resume" : "pause",
                    }).catch(() => {})
                  }
                >
                  <Icon name={c.pausedAt ? "play" : "pause"} size={17} />
                  <span>{t(c.pausedAt ? "Resume" : "Pause")}</span>
                </button>
              </div>
              <button className="button" onClick={join}>
                <Icon name="users" />
                {t("Join")}
              </button>
              <a
                className="button live-projection-button"
                href={`/present/${id}?key=${c.displayKey}`}
                target="_blank"
                rel="noreferrer"
                aria-label={t("Open presentation screen")}
                title={t("Open presentation screen")}
              >
                <Icon name="monitor" />
                <span>{t("Open presentation screen")}</span>
              </a>
              {c.status === "live" && (
                <button
                  className="button danger"
                  disabled={busy || !!error}
                  onClick={() => setEnd(true)}
                >
                  <Icon name="stop" />
                  {t("End training")}
                </button>
              )}
            </>
          ) : (
            <>
              {draft ? (
                <>
                  <button
                    className="button practice-ai-button ai-orbit-button"
                    disabled={busy || saving}
                    onClick={openPractice}
                  >
                    <AgentMark size={19} />
                    <span>{t("Practice with AI")}</span>
                  </button>
                  <button
                    className="button primary presentation-start-button"
                    disabled={busy}
                    onClick={start}
                  >
                    <Icon name="monitor" size={19} />
                    {t("Present")}
                    <Icon
                      name="arrow"
                      size={16}
                      className="start-button-arrow"
                    />
                  </button>
                </>
              ) : c.status === "live" ? (
                <button
                  className="button mint"
                  onClick={() => navigate(`/training/${id}/live`)}
                >
                  <Icon name="play" />
                  {t("Back to live training")}
                </button>
              ) : null}
            </>
          )}
        </div>
      </header>
      <SlideRail
        course={c}
        editable={draft && !live}
        disabled={saving || busy || (live && !!error)}
        onAdd={openActivity}
        onSelect={select}
        onReorder={async (ids) => {
          await mutate({ action: "reorder", ids });
        }}
      />
      <main className="editor-stage">
        {live && (
          <LiveConnection
            error={error}
            checking={liveResource.checking}
            lastUpdated={liveResource.lastUpdated}
            onRetry={() => void refresh()}
          />
        )}
        <div className="stage-top">
          <span>
            {live ? (
              <>
                {t(
                  error
                    ? "Last received slide"
                    : "Participants can see this slide",
                )}
              </>
            ) : (
              t("PRESENTATION WORKSPACE")
            )}
          </span>
          {live ? (
            <div className="live-stage-meta">
              <span>
                <Icon name="users" size={15} />
                {t("{count} participants", { count: data.participants.length })}
              </span>
            </div>
          ) : (
            <span>{c.originalName}</span>
          )}
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
            disabled={index === 0 || saving || (live && !!error)}
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
            disabled={
              index === c.slides.length - 1 || saving || (live && !!error)
            }
            aria-label={t("Next slide")}
            onClick={() => select(c.slides[index + 1].id)}
          >
            <Icon name="right" />
          </button>
        </div>
        <ErrorNote message={notice || (!live ? error : "")} />
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
              disabled={busy || saving}
              onClick={openPreview}
            >
              <Icon name="eye" size={23} />
              <span>{t("Preview")}</span>
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
              onClick={openPractice}
              disabled={busy || saving}
            >
              <Icon name="mic" size={23} />
              <span>{t("Practice")}</span>
            </button>
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
            <LiveAssistant
              data={data}
              disabled={saving || busy || !!error}
              disconnected={!!error}
              lastUpdated={liveResource.lastUpdated}
              onRefreshShowcase={
                c.showcase
                  ? async () => {
                      try {
                        await mutate({ action: "refresh-showcase" });
                      } catch {}
                    }
                  : undefined
              }
            >
              {(topicId, clearTopic) => (
                <QuestionPanel
                  data={data}
                  topicId={topicId}
                  onClearTopic={clearTopic}
                  disabled={saving || busy || !!error}
                  onAddress={async (questionId, value) => {
                    try {
                      await mutate({ action: "addressed", questionId, value });
                    } catch {}
                  }}
                />
              )}
            </LiveAssistant>
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
                <PresentationAgents />
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
                        {t(activityTypeLabel(active.activity?.type))}
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
        {error && (
          <LiveConnection
            error={error}
            checking={liveResource.checking}
            lastUpdated={liveResource.lastUpdated}
            onRetry={() => void refresh()}
          />
        )}
        <div className="modal-actions" hidden={busy}>
          <button
            className="button"
            onClick={() => setEnd(false)}
            disabled={busy}
          >
            {t("Cancel")}
          </button>
          <button
            className="button danger"
            onClick={finish}
            disabled={busy || !!error}
          >
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
      {createTeamOpen && (
        <CreateTeamDialog
          returnFocusRef={teamTrigger}
          onClose={() => setCreateTeamOpen(false)}
          onCreated={(data) => {
            team.setData(data);
            setCreateTeamOpen(false);
            setInviteTeamOpen(true);
          }}
        />
      )}
      {inviteTeamOpen && team.data?.team && (
        <InviteTeamDialog
          teamName={team.data.team.name}
          returnFocusRef={teamTrigger}
          onClose={() => setInviteTeamOpen(false)}
          onChanged={team.refresh}
        />
      )}
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
        <AccessDurationSelect value={days} onChange={setDays} disabled={busy} />
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
  topicId,
  onClearTopic,
  disabled,
  onAddress,
}: {
  data: CourseState;
  topicId: string | null;
  onClearTopic: () => void;
  disabled: boolean;
  onAddress: (id: string, value: boolean) => Promise<void>;
}) {
  const { t } = useLocale();

  const [filter, setFilter] = useState("all");
  const questions = data.questions.filter((q) =>
      topicId
        ? q.groupId === topicId
        : filter === "all" ||
          ((q.status === "escalated" || q.status === "manual") && !q.addressed),
    ),
    groups = [
      ...new Map(questions.map((q) => [q.groupId, q.groupTitle])).entries(),
    ];
  return (
    <>
      <div className="tool-title">
        <h2>{t("Participant questions")}</h2>
        <span className="count">{questions.length}</span>
      </div>
      {topicId ? (
        <button
          className="text-button live-clear-topic"
          onClick={() => {
            setFilter("all");
            onClearTopic();
          }}
        >
          <Icon name="back" size={15} />
          {t("Back to all questions")}
        </button>
      ) : (
        <div className="segmented compact">
          <button
            className={filter === "all" ? "active" : ""}
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            {t("All")}
          </button>
          <button
            className={filter === "teacher" ? "active" : ""}
            aria-pressed={filter === "teacher"}
            onClick={() => setFilter("teacher")}
          >
            {t("Forwarded to you")}
          </button>
        </div>
      )}
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
            open={!!topicId || filter === "teacher"}
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
                          disabled={disabled}
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
