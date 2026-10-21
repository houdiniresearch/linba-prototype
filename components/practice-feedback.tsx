"use client";

import type { RefObject } from "react";
import type { Rehearsal } from "@/lib/types";
import { formatPracticeDuration } from "@/lib/practice-clock";
import { AgentMark } from "./agent-identity";
import { useProductLocale as useLocale } from "./product-locale";
import { Modal } from "./ui";

export function PracticeFeedback({
  open,
  onClose,
  rehearsal,
  feedback,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  rehearsal: Rehearsal;
  feedback: NonNullable<Rehearsal["feedback"]>;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const { t, locale } = useLocale();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Practice feedback")}
      description={t("Your feedback focuses on your teaching performance.")}
      className="practice-feedback-dialog"
      returnFocusRef={returnFocusRef}
    >
      <div className="practice-feedback">
        <header>
          <div>
            <h3 className="practice-feedback-title">
              {t("For your next session")}
            </h3>
            <time dateTime={rehearsal.createdAt}>
              {new Date(rehearsal.createdAt).toLocaleString(
                locale === "en" ? "en-GB" : "tr-TR",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                },
              )}
              {typeof rehearsal.durationSeconds === "number" && (
                <> · {formatPracticeDuration(rehearsal.durationSeconds)}</>
              )}
            </time>
          </div>
          <AgentMark size={28} />
        </header>
        <p className="practice-feedback-summary">{feedback.summary}</p>
        {feedback.suggestions.length > 0 && (
          <>
            <h3>{t("Suggestions for improvement")}</h3>
            <ol className="practice-feedback-actions">
              {feedback.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ol>
          </>
        )}
        {feedback.questions.length > 0 && (
          <details className="practice-feedback-questions">
            <summary>
              {t("Questions asked in practice")}{" "}
              <span>{feedback.questions.length}</span>
            </summary>
            <ul>
              {feedback.questions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <footer className="practice-feedback-footer">
        <button className="button primary" onClick={onClose}>
          {t("Back to practice room")}
        </button>
      </footer>
    </Modal>
  );
}
