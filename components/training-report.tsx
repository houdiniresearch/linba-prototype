"use client";
import { useEffect, useRef } from "react";
import type { CourseState } from "@/lib/types";
import { learningSignals } from "@/lib/learning-insights";
import { pollResults } from "@/lib/activities";
import { ReportAssistantLink } from "./report-assistant-link";
import { ReportDetailSkeleton } from "./skeletons";
import { useLocale } from "./locale-provider";
import { Icon, ResourceFailure, Status, date, useResource } from "./ui";

function scrollReport(
  root: HTMLDivElement | null,
  section: string,
  embedded: boolean,
) {
  if (!root) return;
  const target = root.querySelector<HTMLElement>(`#${section}`);
  if (!embedded) {
    target?.scrollIntoView({ block: "start" });
    return;
  }
  const viewport = root.parentElement;
  if (viewport && (target || section === "report-top"))
    viewport.scrollTo({
      top: target
        ? viewport.scrollTop +
          target.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top -
          20
        : 0,
      behavior: "instant",
    });
}

export function Report({
  id,
  onBack,
  embedded = false,
  focusSection,
}: {
  id: string;
  onBack?: () => void;
  embedded?: boolean;
  focusSection?: { section: string; request: number };
}) {
  const { t, locale } = useLocale();
  const root = useRef<HTMLDivElement>(null);

  const { data, error, refresh } = useResource<CourseState>(
    `courses/${id}`,
    5000,
  );
  const loaded = !!data;
  useEffect(() => {
    const section = embedded ? focusSection?.section : location.hash.slice(1);
    if (
      loaded &&
      section &&
      [
        "report-top",
        "report-overview",
        "report-questions",
        "report-activities",
      ].includes(section)
    )
      scrollReport(root.current, section, embedded);
  }, [loaded, id, embedded, focusSection]);
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={refresh} />
    ) : (
      <ReportDetailSkeleton />
    );
  const { course: c, questions, participants, responses } = data;
  const signals = learningSignals(questions);
  const groups = [
    ...new Map(questions.map((q) => [q.groupId, q.groupTitle])).entries(),
  ];
  const Heading = embedded ? "h2" : "h1";
  return (
    <div
      ref={root}
      className={`report-detail ${embedded ? "report-detail-embedded" : ""}`}
      onClick={(event) => {
        const link =
          event.target instanceof Element ? event.target.closest("a") : null;
        const href = link?.getAttribute("href");
        if (embedded && href?.startsWith("#report-")) {
          event.preventDefault();
          scrollReport(root.current, href.slice(1), true);
        }
      }}
    >
      {!embedded && (
        <button className="text-button" onClick={onBack}>
          <Icon name="back" />
          {t("Back to reports")}
        </button>
      )}
      <div className="page-title">
        <div>
          <span className="eyebrow">{t("TRAINING REPORT")}</span>
          <Heading>{c.name}</Heading>
          <p className="muted">
            {c.endedAt ? date(c.endedAt, locale) : t("Not completed yet")}{" "}
            {t("· Updated with records after training.")}
          </p>
        </div>
        {!embedded && (
          <div className="report-title-actions">
            <Status status={c.status} />
            <ReportAssistantLink id={c.id} />
          </div>
        )}
      </div>
      <div className="metrics" id="report-overview">
        {[
          [participants.length, t("Participant")],
          [questions.length, t("Question")],
          [
            questions.filter((q) => q.status === "answered").length,
            t("AI answer"),
          ],
          [responses.length, t("Activity response")],
        ].map(([number, label]) => (
          <div key={label}>
            <strong>{number}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="report-section learning-overview">
        <div className="section-title">
          <h2>{t("Learning signals")}</h2>
          <span className="small muted">
            {t("From this training’s recorded questions and responses")}
          </span>
        </div>
        <div className="insight-columns">
          <div>
            <h3>{t("Topics prompting questions")}</h3>
            {signals.topics.length ? (
              <ul className="topic-signals">
                {signals.topics.slice(0, 4).map((topic) => (
                  <li key={topic.id}>
                    <a
                      href={`#report-topic-${topic.id}`}
                      onClick={() => {
                        const group = document.getElementById(
                          `report-topic-${topic.id}`,
                        );
                        if (group instanceof HTMLDetailsElement)
                          group.open = true;
                      }}
                    >
                      {topic.title}
                    </a>
                    <span>
                      {topic.count} {t("questions")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {t(
                  "There are not enough sourced answers to identify topics yet.",
                )}
              </p>
            )}
          </div>
          <div>
            <h3>{t("Questions to review")}</h3>
            <p>
              {t("{count} questions still need instructor review.", {
                count: signals.needsReview.length,
              })}
            </p>
            <p className="small muted">
              {t(
                "A question without a sourced answer is not evidence of a learning gap.",
              )}
            </p>
            <a className="text-button" href="#report-questions">
              {t("Review the records")}
              <Icon name="arrow" size={16} />
            </a>
          </div>
        </div>
      </section>
      <section className="report-section">
        <div className="section-title">
          <h2>{t("Training summary")}</h2>
          <span className="small muted">
            {c.report?.ai ? t("Prepared by AI") : t("Compiled from records")}
            {c.report && ` · ${date(c.report.updatedAt, locale)}`}
          </span>
        </div>
        <p>
          {c.report?.ai
            ? c.report.summary
            : t(
                "{questions} questions and {responses} activity responses were recorded. {review} questions need instructor review.",
                {
                  questions: questions.length,
                  responses: responses.length,
                  review: signals.needsReview.length,
                },
              )}
        </p>
        {c.report?.recommendations.length ? (
          <details className="recommendations-panel">
            <summary>{t("AI suggestions for your next training")}</summary>
            <p className="small muted">
              {t(
                "Review suggestions against the source records before acting on them.",
              )}
            </p>
            <ul className="recommendations">
              {c.report.recommendations.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>
      <section className="report-section" id="report-questions">
        <h2>
          {t("Questions and answers")}{" "}
          <span className="count">{questions.length}</span>
        </h2>
        {groups.length ? (
          groups.map(([id, title]) => (
            <details
              key={id}
              id={`report-topic-${id}`}
              className="question-group"
            >
              <summary>
                {title}
                <span>
                  {questions.filter((q) => q.groupId === id).length}{" "}
                  {t("questions")}
                </span>
              </summary>
              {questions
                .filter((q) => q.groupId === id)
                .map((q) => (
                  <div className="question-record" key={q.id}>
                    <div className="small muted">
                      {q.userName} ·{" "}
                      {q.stage === "followup"
                        ? t("After training")
                        : t("Live training")}{" "}
                      · {date(q.createdAt, locale)}
                    </div>
                    <strong>{q.text}</strong>
                    <p>
                      {q.answer ||
                        (q.status === "manual"
                          ? t("Forwarded to the instructor.")
                          : q.reason ||
                            t(
                              "Your question was forwarded to the instructor.",
                            ))}
                    </p>
                    {q.sources.length > 0 && (
                      <div className="report-source-links">
                        {q.sources.map((number) => (
                          <a
                            key={number}
                            className="source"
                            href={`/training/${c.id}/preview?slide=${number}`}
                          >
                            {t("Source: Slide")} {number}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </details>
          ))
        ) : (
          <p className="muted">{t("No questions yet.")}</p>
        )}
      </section>
      <section className="report-section" id="report-activities">
        <h2>
          {t("Activity results")}{" "}
          <span className="count">{responses.length}</span>
        </h2>
        {c.slides
          .filter((s) => s.kind === "activity")
          .map((s) => {
            const rs = responses.filter((r) => r.slideId === s.id);
            return (
              <div className="activity-result" key={s.id}>
                <h3>{s.activity?.question}</h3>
                <p className="small muted">
                  {rs.length} {t("responses")}
                </p>
                {s.activity?.type === "poll"
                  ? pollResults(s.activity.options, rs).map(
                      ({ option, count, percentage }) => {
                        return (
                          <div className="result-row" key={option}>
                            <span>{option}</span>
                            <div className="result-track">
                              <i
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>
                            <strong>{count}</strong>
                          </div>
                        );
                      },
                    )
                  : rs.map((r) => (
                      <div className="question-record" key={r.id}>
                        <span className="small muted">{r.userName}</span>
                        <p>{r.value}</p>
                      </div>
                    ))}
              </div>
            );
          })}
        {!c.slides.some((s) => s.kind === "activity") && (
          <p className="muted">{t("This training has no activities.")}</p>
        )}
      </section>
    </div>
  );
}
