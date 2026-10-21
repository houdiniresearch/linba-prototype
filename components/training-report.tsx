"use client";
import { isChoiceActivity } from "@/lib/activities";
import { useEffect, useRef, useState, useId, useCallback } from "react";
import {
  reportTabs,
  reportTabForSection,
  type ReportTab,
} from "@/lib/report-navigation";
import { MemberAvatar } from "./team-workspace";
import type { CourseState } from "@/lib/types";
import { ParticipantSourcePreview } from "./participant-source";
import { learningSignals } from "@/lib/learning-insights";
import { pollResults } from "@/lib/activities";
import { ReportAssistantLink } from "./report-assistant-link";
import { formatTrainingDuration } from "@/lib/training-duration";
import { ReportDetailSkeleton } from "./skeletons";
import { useProductLocale as useLocale } from "./product-locale";
import {
  Icon,
  api,
  Empty,
  ErrorNote,
  ResourceFailure,
  date,
  dateTime,
  useResource,
} from "./ui";

function scrollReport(
  root: HTMLDivElement | null,
  section: string,
  embedded: boolean,
  moveFocus = false,
) {
  if (!root) return;
  const target =
    section === "report-top"
      ? root
      : root.querySelector<HTMLElement>(`#${CSS.escape(section)}`);
  if (target instanceof HTMLDetailsElement) target.open = true;
  if (moveFocus)
    (target instanceof HTMLDetailsElement
      ? target.querySelector("summary")
      : target
    )?.focus({ preventScroll: true });
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
  const [source, setSource] = useState<{
    questionId: string;
    page: number;
  } | null>(null);
  const sourceTrigger = useRef<HTMLElement | null>(null);
  const [retryingSummary, setRetryingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const { data, error, refresh } = useResource<CourseState>(
    `reports/${id}`,
    5000,
  );
  const loaded = !!data;
  const tabId = useId();
  const [activeTab, setActiveTab] = useState<ReportTab>("report-overview");
  const [jump, setJump] = useState<{
    section: string;
    focus: boolean;
    request: number;
  } | null>(null);
  const navigate = useCallback(
    (section: string, focus = false, scroll = false) => {
      const tab = reportTabForSection(section);
      if (!tab) return;
      setActiveTab(tab);
      setJump(scroll ? { section, focus, request: Date.now() } : null);
      if (!embedded)
        history.replaceState(
          history.state,
          "",
          `${location.pathname}${location.search}#${section}`,
        );
    },
    [embedded],
  );
  useEffect(() => {
    if (!loaded) return;
    const section = embedded
      ? focusSection?.section || "report-overview"
      : location.hash.slice(1) || "report-overview";
    const tab = reportTabForSection(section);
    setActiveTab(tab || "report-overview");
    setJump(
      tab && section !== "report-overview"
        ? { section, focus: !!focusSection, request: Date.now() }
        : null,
    );
    setSource(null);
  }, [loaded, id, embedded, focusSection]);
  useEffect(() => {
    if (loaded && jump)
      scrollReport(root.current, jump.section, embedded, jump.focus);
  }, [loaded, activeTab, jump, embedded]);
  useEffect(() => {
    if (embedded) return;
    const update = () =>
      navigate(location.hash.slice(1) || "report-overview", false, true);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [embedded, navigate]);
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={refresh} />
    ) : (
      <ReportDetailSkeleton />
    );
  const { course: c, questions, participants, responses } = data;
  const signals = learningSignals(questions);
  const preparingSummary = c.report?.status === "pending";
  const summaryFailed = c.report?.status === "error";
  async function retrySummary() {
    setRetryingSummary(true);
    setSummaryError("");
    try {
      await api(`reports/${id}/generate`, {});
      await refresh();
    } catch (error) {
      setSummaryError((error as Error).message);
    } finally {
      setRetryingSummary(false);
    }
  }
  const sourceQuestion = questions.find((q) => q.id === source?.questionId);
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
        if (href?.startsWith("#report-")) {
          event.preventDefault();
          navigate(href.slice(1), true, true);
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
          <span className="report-kind">{t("Training report")}</span>
          <Heading>{c.name}</Heading>
          <dl className="report-session-context">
            <div>
              <dt>{t("Duration")}</dt>
              <dd>
                {formatTrainingDuration(
                  c.startedAt,
                  c.endedAt,
                  locale,
                  c.pausedDurationMs,
                ) || t("Not recorded")}
              </dd>
            </div>
            {c.endedAt && (
              <div>
                <dt>{t("Completion date")}</dt>
                <dd>
                  <time dateTime={c.endedAt}>
                    {dateTime(c.endedAt, locale)}
                  </time>
                </dd>
              </div>
            )}
            <div>
              <dt>{t("Created by")}</dt>
              <dd className="report-author">
                <MemberAvatar name={c.createdBy || t("Unknown creator")} />
                <span>{c.createdBy || t("Unknown creator")}</span>
              </dd>
            </div>
          </dl>
        </div>
        {!embedded && (
          <div className="report-title-actions">
            <ReportAssistantLink id={c.id} />
          </div>
        )}
      </div>
      <ErrorNote message={error} />
      <div
        className="report-section-nav"
        role="tablist"
        aria-label={t("Report sections")}
      >
        {reportTabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${tabId}-${tab}`}
            aria-controls={tab}
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => navigate(tab)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3;
              root.current
                ?.querySelector<HTMLButtonElement>(
                  `[id="${tabId}-${reportTabs[next]}"]`,
                )
                ?.focus();
              navigate(reportTabs[next]);
            }}
          >
            {t(
              ["Overview", "Questions and answers", "Activity results"][index],
            )}
            {index > 0 && (
              <span className="report-tab-count">
                {index === 1 ? questions.length : responses.length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div
        id="report-overview"
        className="report-tab-panel"
        role="tabpanel"
        aria-labelledby={`${tabId}-report-overview`}
        tabIndex={0}
        hidden={activeTab !== "report-overview"}
      >
        <div className="metrics report-record-totals">
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
        <div
          className={`report-overview-layout${questions.length || responses.length ? "" : " is-empty"}`}
        >
          <section
            className="report-section report-summary"
            aria-busy={preparingSummary}
          >
            <div className="section-title">
              <h2>{t("Training summary")}</h2>
              <span className="small muted">
                {preparingSummary
                  ? null
                  : (questions.length || responses.length) && c.report?.ai
                    ? t("Prepared by AI")
                    : t("Compiled from records")}
                {!preparingSummary &&
                (questions.length || responses.length) &&
                c.report
                  ? ` · ${date(c.report.updatedAt, locale)}`
                  : null}
              </span>
            </div>
            {preparingSummary ? (
              <div className="report-preparing" role="status">
                <p>
                  <Icon name="spinner" size={17} className="spin" />
                  {t(
                    "Your AI report is being prepared. Participant records are ready to explore.",
                  )}
                </p>
                <div className="report-summary-skeleton" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <h3>{t("Suggestions for your next presentation")}</h3>
                <div className="report-summary-skeleton" aria-hidden="true">
                  <i />
                  <i />
                </div>
              </div>
            ) : questions.length || responses.length ? (
              <p>
                {c.report?.ai || c.report?.source === "showcase"
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
            ) : (
              <Empty
                icon="chart"
                compact
                title={t("No interactions recorded yet")}
                description={t(
                  "Participant questions and activity responses will build this report.",
                )}
              />
            )}
            {!preparingSummary &&
              !!(questions.length || responses.length) &&
              (summaryFailed ||
                (!c.report?.ai && c.report?.source !== "showcase")) && (
                <div className="report-summary-retry">
                  <p>
                    {t(
                      summaryFailed
                        ? "The AI summary could not be prepared. Your participant records are saved."
                        : "The AI summary is not ready yet. You can already explore participant records.",
                    )}
                  </p>
                  <button
                    className="button"
                    disabled={retryingSummary}
                    onClick={() => void retrySummary()}
                  >
                    <Icon
                      name={retryingSummary ? "spinner" : "arrow"}
                      size={16}
                      className={retryingSummary ? "spin" : undefined}
                    />
                    {t(summaryFailed ? "Try again" : "Prepare AI summary")}
                  </button>
                  <ErrorNote message={summaryError} />
                </div>
              )}
            {!preparingSummary &&
            (questions.length || responses.length) &&
            c.report?.recommendations.length ? (
              <details className="recommendations-panel">
                <summary>
                  {t(
                    c.report.source === "showcase"
                      ? "Suggestions for your next presentation"
                      : "AI suggestions for your next training",
                  )}
                </summary>
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

          {!!(questions.length || responses.length) && (
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
                              const group = root.current?.querySelector(
                                `#${CSS.escape(`report-topic-${topic.id}`)}`,
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
          )}
        </div>
      </div>
      <section
        className="report-section report-tab-panel report-record-panel"
        id="report-questions"
        role="tabpanel"
        aria-labelledby={`${tabId}-report-questions`}
        tabIndex={0}
        hidden={activeTab !== "report-questions"}
      >
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
                      · {dateTime(q.createdAt, locale)}
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
                          <button
                            key={number}
                            className="source"
                            onClick={(event) => {
                              sourceTrigger.current = event.currentTarget;
                              setSource({ questionId: q.id, page: number });
                            }}
                          >
                            {t("Source: Slide")} {number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </details>
          ))
        ) : (
          <Empty
            icon="chat"
            compact
            title={t("No participant questions in this session")}
            description={t(
              "Questions shared during training are collected here.",
            )}
          />
        )}
      </section>
      <section
        className="report-section report-tab-panel report-record-panel"
        id="report-activities"
        role="tabpanel"
        aria-labelledby={`${tabId}-report-activities`}
        tabIndex={0}
        hidden={activeTab !== "report-activities"}
      >
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
                {isChoiceActivity(s.activity?.type)
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
          <Empty
            icon="activity"
            compact
            title={t("No activity results yet")}
            description={t("This training has no activities.")}
          />
        )}
      </section>
      {source && sourceQuestion && (
        <ParticipantSourcePreview
          course={c}
          question={sourceQuestion}
          pageNumber={source.page}
          panelId="report-source-preview"
          onPage={(page) => setSource({ ...source, page })}
          onClose={() => setSource(null)}
          returnFocusRef={sourceTrigger}
        />
      )}
    </div>
  );
}
