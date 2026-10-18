"use client";
import { OperationProgress } from "./operation-progress";
import { ThemeMenu } from "./theme-menu";
import { EditorSkeleton } from "./skeletons";
import { useLocale } from "./locale-provider";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { Activity, Course, CourseState, Slide } from "@/lib/types";
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

function ActivityEditor({
  course,
  slide,
  open,
  onClose,
  onSave,
}: {
  course: Course;
  slide?: Slide;
  open: boolean;
  onClose: () => void;
  onSave: (value: Activity) => Promise<void>;
}) {
  const { t } = useLocale();

  const [type, setType] = useState<Activity["type"]>(
      slide?.activity?.type || "poll",
    ),
    [question, setQuestion] = useState(slide?.activity?.question || ""),
    [options, setOptions] = useState(
      slide?.activity?.options.length ? slide.activity.options : ["", ""],
    ),
    [ai, setAI] = useState(!!slide?.activity?.aiGenerated),
    [busy, setBusy] = useState(false),
    [generating, setGenerating] = useState(false),
    [error, setError] = useState("");
  async function generate() {
    if (busy) return;
    setBusy(true);
    setGenerating(true);
    setError("");
    try {
      const active = course.slides.find((s) => s.id === course.activeSlideId);
      const result = await api(`courses/${course.id}/generate-activity`, {
        type,
        pageId: active?.pageId,
      });
      setType(result.activity.type);
      setQuestion(result.activity.question);
      setOptions(result.activity.options);
      setAI(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setGenerating(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      closeDisabled={busy}
      title={slide ? t("Edit activity") : t("Add activity")}
      description={t("The activity is placed after the selected slide.")}
      wide
    >
      <div className="activity-dialog">
        <div>
          <div className="activity-type-list">
            {[
              [
                "poll",
                "chart",
                t("Poll"),
                t("Collect answers from a set of options."),
              ],
              [
                "open",
                "chat",
                t("Open question"),
                t("Let participants answer in their own words."),
              ],
              [
                "scenario",
                "activity",
                t("Scenario"),
                t("Practice with a real-world situation."),
              ],
            ].map(([value, icon, title, desc]) => (
              <button
                className={type === value ? "selected" : ""}
                key={value}
                disabled={busy}
                onClick={() => setType(value as Activity["type"])}
              >
                <Icon name={icon as "chart"} size={24} />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <Icon name="right" size={16} />
              </button>
            ))}
          </div>
          <button
            className="button ai-button"
            disabled={busy}
            onClick={generate}
          >
            <Icon name="sparkle" />
            {busy ? t("Preparing…") : t("Generate from this slide with AI")}
          </button>
          <p className="small muted">
            {t("Based on your document; review it before saving.")}
          </p>
        </div>
        {generating && <OperationProgress kind="activity" compact />}
        <form
          hidden={generating}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await onSave({
                type,
                question,
                options:
                  type === "poll"
                    ? options.map((v) => v.trim()).filter(Boolean)
                    : [],
                aiGenerated: ai,
              });
              onClose();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {t("Activity question")}
            <textarea
              disabled={busy}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("What would you like to ask your participants?")}
              rows={5}
              maxLength={3000}
              required
            />
          </label>
          {type === "poll" && (
            <fieldset className="activity-options-editor">
              <legend>{t("Answer options")}</legend>
              {options.map((option, index) => (
                <div className="activity-option-row" key={index}>
                  <span aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    aria-label={t("Option {number}", { number: index + 1 })}
                    placeholder={t("Option {number}", { number: index + 1 })}
                    value={option}
                    required
                    maxLength={500}
                    disabled={busy}
                    onChange={(event) =>
                      setOptions(
                        options.map((value, i) =>
                          i === index ? event.target.value : value,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("Remove option {number}", {
                      number: index + 1,
                    })}
                    disabled={busy || options.length <= 2}
                    onClick={() =>
                      setOptions(options.filter((_, i) => i !== index))
                    }
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => setOptions([...options, ""])}
                >
                  <Icon name="plus" size={16} />
                  {t("Add answer option")}
                </button>
              )}
              <p className="small muted">
                {t("Use between two and six distinct options.")}
              </p>
            </fieldset>
          )}
          <ErrorNote message={error} />
          <button className="button primary full" disabled={busy}>
            <Icon name="check" />
            {slide ? t("Save changes") : t("Add to flow")}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export function Editor({ id, live = false }: { id: string; live?: boolean }) {
  const { t, locale } = useLocale();

  const router = useRouter(),
    resource = useResource<CourseState>(`courses/${id}`, live ? 1800 : 0),
    { data, error, setData, refresh } = resource;
  const [add, setAdd] = useState(false),
    [edit, setEdit] = useState(false),
    [settings, setSettings] = useState(false),
    [end, setEnd] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [drag, setDrag] = useState(""),
    [showJoin, setShowJoin] = useState(false),
    [joinBase, setJoinBase] = useState(""),
    [saving, setSaving] = useState(false),
    [toolsOpen, setToolsOpen] = useState(false);
  const toolsTrigger = useRef<HTMLButtonElement>(null);
  const toolsPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!toolsOpen) return;
    toolsPanel.current
      ?.querySelector<HTMLButtonElement>(".editor-tools-close")
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setToolsOpen(false);
        toolsTrigger.current?.focus();
      }
      if (event.key === "Tab") {
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
  }, [toolsOpen]);
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
  async function move(slideId: string, target: string) {
    if (slideId === target) return;
    const ids = c.slides.map((s) => s.id);
    ids.splice(ids.indexOf(slideId), 1);
    ids.splice(ids.indexOf(target), 0, slideId);
    try {
      await mutate({ action: "reorder", ids });
    } catch {}
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
          <h1>{c.name}</h1>
          <span className="small muted">
            {saving
              ? t("Saving…")
              : live
                ? t("Instructor controls")
                : t("Changes saved")}
            <Icon name="check" size={14} />
          </span>
        </div>
        <Status status={c.status} />
        <div className="editor-header-actions">
          <ThemeMenu />
          {!live && (
            <button
              ref={toolsTrigger}
              className="icon-button editor-tools-trigger"
              aria-label={t("Training tools")}
              aria-expanded={toolsOpen}
              aria-controls="training-tools"
              onClick={() => setToolsOpen(!toolsOpen)}
            >
              <Icon name="settings" />
            </button>
          )}
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
              <button
                className="button"
                onClick={() => router.push(`/training/${id}/preview`)}
              >
                <Icon name="eye" />
                {t("Preview")}
              </button>
              <button
                className="button"
                onClick={() => router.push(`/training/${id}/practice`)}
              >
                <Icon name="mic" />
                {t("Practice")}
              </button>
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
                <button
                  className="button report"
                  onClick={() => router.push(`/?view=reports&report=${id}`)}
                >
                  <Icon name="chart" />
                  {t("Open report")}
                </button>
              )}
            </>
          )}
        </div>
      </header>
      <aside className="slide-rail">
        <div className="rail-heading">
          {draft && !live ? (
            <button className="text-button" onClick={() => setAdd(true)}>
              <Icon name="plus" />
              {t("Add activity")}
            </button>
          ) : (
            <strong>{t("Presentation flow")}</strong>
          )}
          <span>
            {c.slides.length} {t("slides")}
          </span>
        </div>
        <ol className="thumbnails">
          {c.slides.map((s, i) => (
            <li
              key={s.id}
              className={active.id === s.id ? "selected" : ""}
              onDragOver={(e) => {
                if (drag) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                void move(drag, s.id);
                setDrag("");
              }}
            >
              <span className="slide-number">{i + 1}</span>
              <button
                className="thumbnail"
                onClick={() => select(s.id)}
                draggable={draft && !live && s.kind === "activity"}
                onDragStart={() => setDrag(s.id)}
                onDragEnd={() => setDrag("")}
                aria-label={`${t("Slide")} ${i + 1}: ${slideTitle(c, s, locale)}`}
                aria-current={active.id === s.id ? "true" : undefined}
              >
                <SlideView course={c} slide={s} small />
              </button>
              <div className="thumbnail-caption">
                {s.kind === "document" ? (
                  <span>
                    {t("Presentation ·")}{" "}
                    {c.pages.find((p) => p.id === s.pageId)?.number}
                  </span>
                ) : (
                  <>
                    <span>
                      <Icon name="activity" size={13} />
                      {t("Activity")}
                    </span>
                    {draft && !live && (
                      <div>
                        <button
                          className="mini-button"
                          aria-label={t("Move activity up")}
                          disabled={i === 0}
                          onClick={() => move(s.id, c.slides[i - 1].id)}
                        >
                          <Icon name="up" size={14} />
                        </button>
                        <button
                          className="mini-button"
                          aria-label={t("Move activity down")}
                          disabled={i === c.slides.length - 1}
                          onClick={async () => {
                            const ids = c.slides.map((s) => s.id);
                            [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
                            try {
                              await mutate({ action: "reorder", ids });
                            } catch {}
                          }}
                        >
                          <Icon name="down" size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="rail-bottom">
          <Logo />
        </div>
      </aside>
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
        {live ? (
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
        ) : (
          <div className="stage-note">
            <Icon name="file" />
            <div>
              <strong>
                {active.kind === "document"
                  ? t("Original presentation slide")
                  : t("Interactive activity")}
              </strong>
              <p>
                {active.kind === "document"
                  ? t(
                      "The original presentation is preserved. You can add an activity after this slide.",
                    )
                  : t(
                      "During live training, this slide opens participants’ Activities tab.",
                    )}
              </p>
            </div>
          </div>
        )}
      </main>
      {toolsOpen && (
        <button
          className="editor-tools-overlay"
          aria-label={t("Close training tools")}
          onClick={() => {
            setToolsOpen(false);
            toolsTrigger.current?.focus();
          }}
        />
      )}
      <aside
        ref={toolsPanel}
        id="training-tools"
        role={toolsOpen ? "dialog" : undefined}
        aria-modal={toolsOpen || undefined}
        aria-label={t("Training tools")}
        className={`editor-tools ${live ? "questions-panel" : ""}`}
      >
        {!live && (
          <button
            className="icon-button editor-tools-close"
            aria-label={t("Close training tools")}
            onClick={() => {
              setToolsOpen(false);
              toolsTrigger.current?.focus();
            }}
          >
            <Icon name="close" />
          </button>
        )}
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
            <div className="tool-title">
              <h2>{active.kind === "document" ? t("Slide") : t("Activity")}</h2>
              <Icon
                name={active.kind === "document" ? "presentation" : "activity"}
              />
            </div>
            {active.kind === "document" ? (
              <>
                <p className="muted small">{slideTitle(c, active, locale)}</p>
                <div className="tool-block">
                  <strong>{t("Make this slide interactive")}</strong>
                  <p>
                    {t("Ask for participants’ views or discuss a scenario.")}
                  </p>
                  <button
                    className="button full"
                    disabled={!draft}
                    onClick={() => setAdd(true)}
                  >
                    <Icon name="plus" />
                    {t("Add activity")}
                  </button>
                </div>
                <div className="tool-block">
                  <Icon name="sparkle" />
                  <strong>{t("Learning agent")}</strong>
                  <p>
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
                </div>
              </>
            ) : (
              <>
                <p className="muted small">
                  {active.activity?.type === "poll"
                    ? t("Poll")
                    : active.activity?.type === "scenario"
                      ? t("Scenario")
                      : t("Open question")}
                </p>
                <p className="activity-question-small">
                  {active.activity?.question}
                </p>
                {active.activity?.aiGenerated && (
                  <span className="ai-label">
                    <Icon name="sparkle" size={16} />
                    {t("Generated with AI")}
                  </span>
                )}
                <button
                  className="button full"
                  disabled={!draft}
                  onClick={() => setEdit(true)}
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
                <div className="tool-block">
                  <strong>{t("Move in flow")}</strong>
                  <p>
                    {t(
                      "Drag the activity on the left or use the arrows to move it.",
                    )}
                  </p>
                </div>
              </>
            )}
            <button className="tool-settings" onClick={() => setSettings(true)}>
              <Icon name="settings" />
              {t("Training settings")}
              <Icon name="right" size={16} />
            </button>
            <div className="tool-meta">
              <span>
                <Icon name="clock" size={16} />
                {c.accessDays} {t("days of learning agent access")}
              </span>
              <span>
                <Icon name="chat" size={16} />
                {c.autoAnswer
                  ? t("Live AI answers on")
                  : t("Live AI answers off")}
              </span>
            </div>
          </>
        )}
      </aside>
      {add && (
        <ActivityEditor
          course={c}
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
            "Questions and activity results will be added to your report. This session cannot be restarted.",
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
}: {
  course: Course;
  onClose: () => void;
  onSave: (body: object) => Promise<void>;
}) {
  const { t } = useLocale();

  const [name, setName] = useState(c.name),
    [days, setDays] = useState(c.accessDays),
    [auto, setAuto] = useState(c.autoAnswer),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title={t("Training settings")}>
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
