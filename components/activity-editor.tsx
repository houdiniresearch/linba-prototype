"use client";
import { useState } from "react";
import type { Activity, Course, Slide } from "@/lib/types";
import { hasDuplicateOptions } from "@/lib/activities";
import {
  ACTIVITY_LIBRARY,
  searchActivityLibrary,
} from "@/lib/activity-library";
import { AgentMark } from "./agent-identity";
import { OperationProgress } from "./operation-progress";
import { useLocale } from "./locale-provider";
import { api, Icon, Modal, ErrorNote } from "./ui";

function ActivityGlyph({ type }: { type: Activity["type"] }) {
  return (
    <span className={`activity-library-glyph glyph-${type}`} aria-hidden="true">
      <i />
      <i />
      <i />
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
  const selected = ACTIVITY_LIBRARY.find((item) => item.type === type)!;
  const matches = searchActivityLibrary(query, t);
  const insertion =
    Math.max(
      0,
      course.slides.findIndex((s) => s.id === course.activeSlideId),
    ) + 1;

  function chooseType(value: Activity["type"]) {
    setType(value);
    setError("");
    if (value === "poll" && options.length < 2) setOptions(["", ""]);
  }
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
      setOptions(
        result.activity.options.length ? result.activity.options : ["", ""],
      );
      setAI(true);
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
        options: type === "poll" ? cleaned : [],
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
      onClose={() => !busy && onClose()}
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
                <p>{t("Try “poll”, “question” or “scenario”.")}</p>
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
              disabled={busy}
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
            <figure className={`activity-participant-preview preview-${type}`}>
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
                {type === "poll" ? (
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
            {generating ? (
              <OperationProgress kind="activity" compact />
            ) : (
              <div className="activity-question-fields">
                <label>
                  {t("Activity question")}
                  <textarea
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
            )}
          </div>
          <footer className="activity-library-footer">
            <ErrorNote message={error} />
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
                onClick={onClose}
              >
                {t("Cancel")}
              </button>
              <button className="button primary" type="submit" disabled={busy}>
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
          </footer>
        </form>
      </div>
    </Modal>
  );
}
