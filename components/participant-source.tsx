"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Course, Question } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import { SlideView } from "./slides";
import { Icon } from "./ui";

export type ParticipantSource = { questionId: string; page: number };

export function ParticipantSourcePreview({
  course,
  question,
  pageNumber,
  panelId,
  onPage,
  onClose,
  returnFocusRef,
}: {
  course: Course;
  question: Question;
  pageNumber: number;
  panelId: string;
  onPage: (page: number) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  const [compact, setCompact] = useState(false);
  const sourceHeading = useRef<HTMLHeadingElement>(null);
  const previousSource = useRef(`${question.id}:${pageNumber}`);
  useEffect(() => {
    const next = `${question.id}:${pageNumber}`;
    if (previousSource.current !== next)
      sourceHeading.current?.focus({ preventScroll: true });
    previousSource.current = next;
  }, [question.id, pageNumber]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1100px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const page = course.pages.find((item) => item.number === pageNumber);
  const sources = [...new Set(question.sources)];
  const index = sources.indexOf(pageNumber);
  return (
    <Dialog.Root
      open
      modal={compact}
      onOpenChange={(open) => !open && onClose()}
    >
      {compact && <Dialog.Overlay className="participant-source-overlay" />}
      <Dialog.Content
        id={panelId}
        className="participant-source-panel"
        aria-modal={compact || undefined}
        aria-describedby={undefined}
        onInteractOutside={(event) => {
          if (!compact) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected)
            returnFocusRef.current.focus();
        }}
      >
        <header className="participant-source-heading">
          <Icon name="file" size={20} />
          <Dialog.Title>
            {t("Source slide {number}", { number: pageNumber })}
          </Dialog.Title>
          <Dialog.Close className="icon-button" aria-label={t("Close source")}>
            <Icon name="close" />
          </Dialog.Close>
        </header>
        <div className="participant-source-context">
          <span>{t("Source for your question")}</span>
          <p title={question.text}>{question.text}</p>
        </div>
        <div className="participant-source-content" key={pageNumber}>
          {page ? (
            <>
              <h3 ref={sourceHeading} tabIndex={-1}>
                {page.title}
              </h3>
              <SlideView
                participant
                course={course}
                slide={{
                  id: `source-${page.id}`,
                  kind: "document",
                  pageId: page.id,
                }}
              />
              {page.text && (
                <details className="participant-source-text">
                  <summary>
                    {t("Extracted slide text")}
                    <Icon name="downCaret" size={16} />
                  </summary>
                  <p>{page.text}</p>
                </details>
              )}
            </>
          ) : (
            <h3
              ref={sourceHeading}
              tabIndex={-1}
              className="participant-source-unavailable"
              role="alert"
            >
              <Icon name="warning" />
              {t("This source slide is no longer available.")}
            </h3>
          )}
        </div>
        <footer className="participant-source-footer">
          {sources.length > 1 && (
            <nav aria-label={t("Source navigation")}>
              <button
                className="icon-button"
                disabled={index <= 0}
                onClick={() => onPage(sources[index - 1])}
                aria-label={t("Previous source")}
              >
                <Icon name="left" />
              </button>
              <span>
                {index + 1} / {sources.length}
              </span>
              <button
                className="icon-button"
                disabled={index < 0 || index >= sources.length - 1}
                onClick={() => onPage(sources[index + 1])}
                aria-label={t("Next source")}
              >
                <Icon name="right" />
              </button>
            </nav>
          )}
          <button className="button" onClick={onClose}>
            {t("Back to answer")}
          </button>
        </footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
