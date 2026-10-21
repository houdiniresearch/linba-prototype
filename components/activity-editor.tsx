"use client";
import { useEffect, useRef, useState } from "react";
import type { Activity, Course, Slide } from "@/lib/types";
import {
  activityDraftChanged,
  hasDuplicateOptions,
  isChoiceActivity,
} from "@/lib/activities";
import {
  ACTIVITY_LIBRARY,
  UPCOMING_ACTIVITIES,
  searchActivityLibrary,
} from "@/lib/activity-library";
import { AgentMark } from "./agent-identity";
import { OperationProgress } from "./operation-progress";
import { useProductLocale as useLocale } from "./product-locale";
import { api, Icon, Modal, ErrorNote } from "./ui";

function ActivityGlyph({ type }: { type: Activity["type"] }) {
  return (
    <span className={`activity-library-glyph glyph-${type}`} aria-hidden="true">
      {type === "true-false" ? (
        <>
          <Icon name="check" size={15} />
          <Icon name="close" size={13} />
        </>
      ) : (
        <>
          <i />
          <i />
          <i />
        </>
      )}
    </span>
  );
}

export function ActivityEditor({
  course,
  slide,
  open,
  onClose,
  onSave,
  returnFocusRef,
}: {
  course: Course;
  slide?: Slide;
  open: boolean;
  onClose: () => void;
  onSave: (value: Activity) => Promise<void>;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  const [type, setType] = useState<Activity["type"]>(
    slide?.activity?.type || "poll",
  );
  const [question, setQuestion] = useState(slide?.activity?.question || "");
  const [options, setOptions] = useState(
    slide?.activity?.options.length ? slide.activity.options : ["", ""],
  );
  const [ai, setAI] = useState(!!slide?.activity?.aiGenerated);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [discard, setDiscard] = useState(false);
  const [proposal, setProposal] = useState<Activity | null>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const proposalHeading = useRef<HTMLHeadingElement>(null);
  const draft = { type, question, options, aiGenerated: ai };
  const dirty = activityDraftChanged(slide?.activity, draft) || !!proposal;
  useEffect(() => {
    if (!open || (!dirty && !busy)) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [open, dirty, busy]);
  useEffect(() => {
    if (discard) keepEditing.current?.focus();
  }, [discard]);
  useEffect(() => {
    if (proposal) proposalHeading.current?.focus();
  }, [proposal]);
  function requestClose() {
    if (busy) return;
    if (discard) {
      setDiscard(false);
      questionInput.current?.focus();
    } else if (dirty) setDiscard(true);
    else onClose();
  }
  function applyDraft(activity: Activity) {
    setType(activity.type);
    setQuestion(activity.question);
    setOptions(activity.options.length ? activity.options : ["", ""]);
    setAI(true);
    setProposal(null);
    setError("");
    questionInput.current?.focus();
  }
  const selected = ACTIVITY_LIBRARY.find((item) => item.type === type) || {
    title: "Scenario",
    description: "Practice with a real-world situation.",
    sample: "",
    response: "Written response",
  };
  const matches = searchActivityLibrary(query, t);
  const insertion =
    Math.max(
      0,
      course.slides.findIndex((s) => s.id === course.activeSlideId),
    ) + 1;

  function chooseType(value: Activity["type"]) {
    setType(value);
    setError("");
    if (value === "true-false") setOptions([t("True"), t("False")]);
    else if (value === "poll" && (options.length < 2 || type === "true-false"))
      setOptions(["", ""]);
  }
  async function generate() {
    if (busy || proposal) return;
    setBusy(true);
    setGenerating(true);
    setError("");
    try {
      const active = course.slides.find((s) => s.id === course.activeSlideId);
      const result = await api(`courses/${course.id}/generate-activity`, {
        type,
        pageId: active?.pageId,
      });
      if (
        question.trim() ||
        (type === "poll" && options.some((option) => option.trim()))
      )
        setProposal(result.activity);
      else applyDraft(result.activity);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setGenerating(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const cleaned = options.map((option) => option.trim()).filter(Boolean);
    if (!question.trim()) {
      setError(t("Write an activity question first."));
      return;
    }
    if (
      type === "poll" &&
      (cleaned.length < 2 || cleaned.length > 6 || hasDuplicateOptions(cleaned))
    ) {
      setError(t("Use between two and six distinct options."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({
        type,
        question: question.trim(),
        options: isChoiceActivity(type) ? cleaned : [],
        aiGenerated: ai,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={requestClose}
      closeDisabled={busy}
      returnFocusRef={returnFocusRef}
      title={slide ? t("Edit activity") : t("Add activity")}
      description={t(
        "Choose how participants respond, then make the activity your own.",
      )}
      wide
      className="activity-library-modal"
    >
      <div className="activity-library-search">
        <Icon name="search" size={19} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={busy}
          aria-label={t("Search activity types")}
          placeholder={t("Search activity types")}
        />
        {query && (
          <button
            type="button"
            className="icon-button"
            disabled={busy}
            onClick={() => setQuery("")}
            aria-label={t("Clear search")}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <div className="activity-library-body">
        <aside
          className="activity-library-catalog"
          aria-label={t("Activity types")}
        >
          <div className="activity-catalog-heading">
            <h3>{t("Activity types")}</h3>
            <span>{matches.length}</span>
          </div>
          <div className="activity-library-choices">
            {matches.map((item) => (
              <button
                key={item.type}
                type="button"
                disabled={busy}
                aria-pressed={type === item.type}
                onClick={() => chooseType(item.type)}
              >
                <ActivityGlyph type={item.type} />
                <span>
                  <strong>{t(item.title)}</strong>
                  <small>{t(item.response)}</small>
                </span>
                {type === item.type && <Icon name="check" size={17} />}
              </button>
            ))}
            {!matches.length && (
              <div className="activity-search-empty">
                <strong>{t("No matching activity types")}</strong>
                <p>
                  {t(
                    "Try “multiple choice”, “true or false” or “open question”.",
                  )}
                </p>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => setQuery("")}
                >
                  {t("Clear search")}
                </button>
              </div>
            )}
          </div>
          <section className="activity-upcoming" aria-label={t("Coming soon")}>
            <h3>{t("Coming soon")}</h3>
            <ul>
              {UPCOMING_ACTIVITIES.filter(
                (item) =>
                  !query.trim() ||
                  `${t(item.title)} ${item.keywords}`
                    .toLocaleLowerCase("tr-TR")
                    .includes(query.trim().toLocaleLowerCase("tr-TR")),
              ).map((item) => (
                <li key={item.id}>
                  <Icon
                    name={item.id === "roleplay" ? "users" : "chat"}
                    size={19}
                  />
                  <span>{t(item.title)}</span>
                  <small>{t("Coming soon")}</small>
                </li>
              ))}
            </ul>
          </section>
          <div className="activity-generation-box">
            <AgentMark size={26} />
            <h3>{t("Start with your training")}</h3>
            <p>
              {t(
                "Let your activity agent draft a question from the selected slide.",
              )}
            </p>
            <button
              className="button"
              type="button"
              disabled={busy || !!proposal || type === "scenario"}
              onClick={generate}
            >
              <Icon
                name={generating ? "spinner" : "plus"}
                className={generating ? "spin" : undefined}
                size={17}
              />
              {generating ? t("Preparing…") : t("Generate an activity")}
            </button>
            <small>{t("Review the draft before adding it.")}</small>
          </div>
        </aside>
        <form
          className="activity-library-editor"
          onSubmit={save}
          id="activity-library-form"
        >
          <div className="activity-library-content">
            <div className="activity-selected-heading">
              <div>
                <h3>{t(selected.title)}</h3>
                <p>{t(selected.description)}</p>
              </div>
              <span>{t(selected.response)}</span>
            </div>
            {generating && <OperationProgress kind="activity" compact />}
            {proposal && (
              <section
                className="activity-ai-proposal"
                aria-label={t("AI activity draft")}
              >
                <header>
                  <AgentMark size={20} />
                  <h4 ref={proposalHeading} tabIndex={-1}>
                    {t("Review the AI draft")}
                  </h4>
                  <span>
                    {t(
                      ACTIVITY_LIBRARY.find(
                        (item) => item.type === proposal.type,
                      )!.title,
                    )}
                  </span>
                </header>
                <p>
                  {t(
                    "Your current activity is unchanged. Review this suggestion before replacing it.",
                  )}
                </p>
                <strong>{proposal.question}</strong>
                {isChoiceActivity(proposal.type) && (
                  <ol>
                    {proposal.options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ol>
                )}
                <div>
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      setProposal(null);
                      questionInput.current?.focus();
                    }}
                  >
                    {t("Keep my activity")}
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => applyDraft(proposal)}
                  >
                    {t("Use this draft")}
                  </button>
                </div>
              </section>
            )}
            <div className="activity-question-fields">
              <label>
                {t("Activity question")}
                <textarea
                  ref={questionInput}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={busy}
                  maxLength={3000}
                  required
                  rows={3}
                  placeholder={t(
                    "What would you like to ask your participants?",
                  )}
                />
              </label>
              {type === "true-false" && (
                <fieldset className="activity-options-editor">
                  <legend>{t("Answer options")}</legend>
                  <div className="activity-boolean-options">
                    {options.map((option) => (
                      <span key={option}>{option}</span>
                    ))}
                  </div>
                </fieldset>
              )}
              {type === "poll" && (
                <fieldset className="activity-options-editor">
                  <legend>{t("Answer options")}</legend>
                  {options.map((option, index) => (
                    <div className="activity-option-row" key={index}>
                      <span aria-hidden="true">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <input
                        aria-label={t("Option {number}", {
                          number: index + 1,
                        })}
                        placeholder={t("Option {number}", {
                          number: index + 1,
                        })}
                        value={option}
                        required
                        maxLength={500}
                        disabled={busy}
                        onChange={(e) =>
                          setOptions(
                            options.map((value, i) =>
                              i === index ? e.target.value : value,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="icon-button"
                        disabled={busy || options.length <= 2}
                        aria-label={t("Remove option {number}", {
                          number: index + 1,
                        })}
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
            </div>
            <details className="activity-preview-disclosure">
              <summary>
                <Icon name="eye" size={18} />
                {t("Participant preview")}
                <Icon name="downCaret" size={16} />
              </summary>
              <figure
                className={`activity-participant-preview preview-${type}`}
              >
                <figcaption>
                  {t("Participant preview")}
                  <span>{t("Preview only")}</span>
                </figcaption>
                <div className="activity-preview-card" aria-hidden="true">
                  <span className="activity-preview-kind">
                    <ActivityGlyph type={type} />
                    {t(selected.title)}
                  </span>
                  <strong>{question.trim() || t(selected.sample)}</strong>
                  {isChoiceActivity(type) ? (
                    <div className="activity-preview-options">
                      {options.map((option, index) => (
                        <span key={index}>
                          <i />
                          {option.trim() ||
                            t("Option {number}", { number: index + 1 })}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="activity-preview-answer">
                      {t("Write your answer…")}
                      <span />
                    </div>
                  )}
                </div>
              </figure>
            </details>
          </div>
        </form>
      </div>
      <footer className="activity-library-footer">
        <ErrorNote message={error} />
        {discard ? (
          <div className="activity-discard" role="alert">
            <span>{t("Discard your unsaved changes?")}</span>
            <button
              className="button"
              type="button"
              ref={keepEditing}
              onClick={() => {
                setDiscard(false);
                questionInput.current?.focus();
              }}
            >
              {t("Keep editing")}
            </button>
            <button className="button danger" type="button" onClick={onClose}>
              {t("Discard changes")}
            </button>
          </div>
        ) : (
          <div>
            <span>
              {slide
                ? t("Changes apply to this activity.")
                : t("After slide {number}", { number: insertion })}
            </span>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={requestClose}
            >
              {t("Cancel")}
            </button>
            <button
              className="button primary"
              type="submit"
              form="activity-library-form"
              disabled={busy}
            >
              <Icon
                name={busy && !generating ? "spinner" : "plus"}
                className={busy && !generating ? "spin" : undefined}
                size={18}
              />
              {busy && !generating
                ? t("Saving…")
                : slide
                  ? t("Save changes")
                  : t("Add to flow")}
            </button>
          </div>
        )}
      </footer>
    </Modal>
  );
}
