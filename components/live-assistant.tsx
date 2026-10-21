"use client";
import { isChoiceActivity, activityTypeLabel } from "@/lib/activities";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ActivityResponse, CourseState } from "@/lib/types";
import {
  confusionSpikes,
  currentAssessmentSlide,
  liveActivityResponses,
} from "@/lib/live-insights";
import { pollResults } from "@/lib/activities";
import { AgentMark } from "./agent-identity";
import { PresentationAgents } from "./presentation-agents";
import { ProductSelect } from "./product-select";
import { useProductLocale } from "./product-locale";
import { Icon } from "./ui";

type Section = "overview" | "questions" | "agents";
const sections: Section[] = ["overview", "questions", "agents"];

export function LiveAssistant({
  data,
  disabled,
  lastUpdated,
  disconnected,
  onRefreshShowcase,
  children,
}: {
  data: CourseState;
  disabled: boolean;
  lastUpdated?: number;
  disconnected: boolean;
  onRefreshShowcase?: () => Promise<void>;
  children: (topicId: string | null, clearTopic: () => void) => ReactNode;
}) {
  const { t } = useProductLocale();
  const [selected, setSelected] = useState<Section>("overview");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const focusPanel = useRef(false);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (focusPanel.current) {
      panels.current[sections.indexOf(selected)]?.focus();
      focusPanel.current = false;
    }
  }, [selected, topicId]);
  const spikes = confusionSpikes(
    data.questions,
    data.course,
    disconnected && lastUpdated ? lastUpdated : Math.max(now, lastUpdated || 0),
  );
  const pending = data.questions.filter(
    (q) => (q.status === "escalated" || q.status === "manual") && !q.addressed,
  ).length;
  function viewTopic(id: string | null) {
    focusPanel.current = true;
    setTopicId(id);
    setSelected("questions");
  }
  const confusion = <ConfusionPanel spikes={spikes} onViewTopic={viewTopic} />;
  return (
    <div className="live-assistant live-control-center">
      <div
        className="live-assistant-tabs"
        role="tablist"
        aria-label={t("Instructor controls")}
      >
        {sections.map((section, index) => (
          <button
            key={section}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            id={`${uid}-${section}-tab`}
            role="tab"
            type="button"
            aria-controls={`${uid}-${section}-panel`}
            aria-selected={selected === section}
            tabIndex={selected === section ? 0 : -1}
            onClick={() => setSelected(section)}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "ArrowRight")
                next = (index + 1) % sections.length;
              else if (event.key === "ArrowLeft")
                next = (index + sections.length - 1) % sections.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = sections.length - 1;
              else return;
              event.preventDefault();
              setSelected(sections[next]);
              tabs.current[next]?.focus();
            }}
          >
            {t(
              section === "overview"
                ? "Live overview"
                : section === "questions"
                  ? "Questions"
                  : "Agents",
            )}
            {section === "overview" && spikes.length > 0 && (
              <span
                className="live-spike-dot"
                aria-label={t("Confusion spike detected")}
              />
            )}
            {section === "questions" && pending > 0 && (
              <span
                className="live-question-badge"
                aria-label={t("{count} questions need your attention", {
                  count: pending,
                })}
              >
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-atomic="true">
        {spikes.length
          ? t(
              "Confusion spike: {count} topics are receiving repeated questions.",
              { count: spikes.length },
            )
          : ""}
      </p>
      {spikes.length > 0 && selected === "questions" && (
        <button
          className="live-attention-strip"
          onClick={() => {
            focusPanel.current = true;
            setSelected("overview");
          }}
        >
          <Icon name="warning" size={17} />
          <span>
            Confusion spike <strong>{spikes[0].title}</strong>
          </span>
          <Icon name="right" size={15} />
        </button>
      )}
      {sections.map((section, index) => (
        <div
          key={section}
          ref={(element) => {
            panels.current[index] = element;
          }}
          id={`${uid}-${section}-panel`}
          className="live-assistant-panel"
          role="tabpanel"
          aria-labelledby={`${uid}-${section}-tab`}
          hidden={selected !== section}
          tabIndex={0}
        >
          {section === "overview" ? (
            <>
              {confusion}
              <AssessmentResults data={data} />
            </>
          ) : section === "questions" ? (
            children(topicId, () => {
              focusPanel.current = true;
              setTopicId(null);
            })
          ) : (
            <PresentationAgents />
          )}
        </div>
      ))}
      {data.course.showcase && onRefreshShowcase && selected !== "agents" && (
        <div className="live-showcase-footer">
          <span>{t("Example session data")}</span>
          <button
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={() => void onRefreshShowcase()}
          >
            <Icon name="clock" size={14} />
            {t("Refresh")}
          </button>
        </div>
      )}
    </div>
  );
}

function ConfusionPanel({
  spikes,
  onViewTopic,
}: {
  spikes: ReturnType<typeof confusionSpikes>;
  onViewTopic: (id: string) => void;
}) {
  const { t } = useProductLocale();
  return (
    <section
      className={`live-confusion ${spikes.length ? "has-spike" : ""}`}
      aria-label="Confusion spike"
    >
      <div className="live-section-agent">
        <AgentMark size={15} />
        {t("Learning agent")}
      </div>
      <div className="live-section-title">
        <h3>Confusion spike</h3>
        {spikes.length > 0 ? (
          <Icon name="warning" size={19} />
        ) : (
          <span className="live-window-label">
            <Icon name="clock" size={13} />
            {t("Last 5 min")}
          </span>
        )}
      </div>
      {spikes.length ? (
        <>
          {spikes.slice(0, 3).map((spike) => (
            <div className="live-spike-topic" key={spike.id}>
              <strong>{spike.title}</strong>
              <p>
                {t(
                  "{questions} questions · {participants} participants · last 5 min",
                  { questions: spike.count, participants: spike.participants },
                )}
              </p>
              <button
                className="text-button"
                onClick={() => onViewTopic(spike.id)}
              >
                {t("Review these questions")}
                <Icon name="arrow" size={15} />
              </button>
            </div>
          ))}
        </>
      ) : (
        <p className="live-confusion-caption">
          {t("No question surge in the last 5 minutes.")}
        </p>
      )}
    </section>
  );
}

function AssessmentResults({ data }: { data: CourseState }) {
  const { t } = useProductLocale();
  const [chosen, setChosen] = useState("__follow");
  const course = data.course;
  const activities = course.slides.filter(
    (slide) => slide.kind === "activity" && slide.activity,
  );
  const followed =
    currentAssessmentSlide(course) ||
    (course.showcase ? activities[0] : undefined);
  const slide = activities.find((item) => item.id === chosen) || followed;
  const responses = slide
    ? liveActivityResponses(data.responses, course.id, slide.id)
    : [];
  const activity = slide?.activity;
  const total = Math.max(data.participants.length, responses.length);
  const results =
    activity && isChoiceActivity(activity.type)
      ? pollResults(activity.options, responses)
      : [];
  const largest = Math.max(0, ...results.map((result) => result.count));
  return (
    <section
      className="live-assessment"
      aria-label={t("Live assessment results")}
    >
      <div className="live-section-agent">
        <AgentMark size={15} />
        {t("Assessment agent")}
      </div>
      <div className="live-section-title">
        <h3>{t("Live results")}</h3>
      </div>
      {activities.length > 0 && (
        <ProductSelect
          value={chosen}
          onChange={setChosen}
          label={t("Activity results")}
          options={[
            { value: "__follow", label: t("Follow presentation") },
            ...activities.map((item) => ({
              value: item.id,
              label: t("Slide {number} · {type}", {
                number: course.slides.indexOf(item) + 1,
                type: t(activityTypeLabel(item.activity!.type)),
              }),
            })),
          ]}
        />
      )}
      {slide && activity ? (
        <>
          <div className="live-activity-meta">
            <span className="live-activity-kind">
              <Icon
                name={isChoiceActivity(activity.type) ? "chart" : "chat"}
                size={14}
              />
              {t("Slide {number}", {
                number: course.slides.indexOf(slide) + 1,
              })}
              <span aria-hidden="true">·</span>
              {t(activityTypeLabel(activity.type))}
            </span>
            <span className="live-current-slide">
              {t(
                course.activeSlideId === slide.id
                  ? "On screen now"
                  : chosen === "__follow"
                    ? "Previous activity"
                    : "Selected results",
              )}
            </span>
          </div>
          <h4>{activity.question}</h4>
          {total > 0 && (
            <div className="live-participation">
              <div>
                <span>{t("Participation")}</span>
                <strong>
                  {responses.length}
                  <span> / {total}</span>
                </strong>
              </div>
              <progress
                value={responses.length}
                max={total}
                aria-label={t("{answered} of {total} participants responded", {
                  answered: responses.length,
                  total,
                })}
              />
            </div>
          )}
          {responses.length ? (
            <>
              {isChoiceActivity(activity.type) ? (
                <ul
                  className="live-poll-results"
                  aria-label={t("Response distribution")}
                >
                  {results.map((result) => (
                    <li
                      key={result.option}
                      className={
                        result.count === largest && largest > 0
                          ? "is-leading"
                          : undefined
                      }
                    >
                      <div>
                        <span>{result.option}</span>
                        <strong>
                          {Math.round(result.percentage)}%{" "}
                          <small>({result.count})</small>
                        </strong>
                      </div>
                      <meter
                        min={0}
                        max={100}
                        value={result.percentage}
                        aria-label={result.option}
                      >
                        {Math.round(result.percentage)}%
                      </meter>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="live-written-responses">
                  {responses.slice(0, 3).map((response) => (
                    <LiveWrittenResponse
                      key={response.id}
                      response={response}
                    />
                  ))}
                  {responses.length > 3 && (
                    <details>
                      <summary>
                        {t("Show {count} more responses", {
                          count: responses.length - 3,
                        })}
                        <Icon name="down" size={15} />
                      </summary>
                      {responses.slice(3).map((response) => (
                        <LiveWrittenResponse
                          key={response.id}
                          response={response}
                        />
                      ))}
                    </details>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="live-data-empty">
              {t("Results appear here as participants respond.")}
            </p>
          )}
        </>
      ) : (
        <p className="live-data-empty">
          {t(
            activities.length
              ? "Start an activity or choose one to follow its responses here."
              : "Activity responses will appear here when your presentation includes an activity.",
          )}
        </p>
      )}
    </section>
  );
}

function LiveWrittenResponse({ response }: { response: ActivityResponse }) {
  const { locale } = useProductLocale();
  return (
    <article>
      <header>
        <span className="live-response-avatar" aria-hidden="true">
          {response.userName.charAt(0)}
        </span>
        <strong>{response.userName}</strong>
        <time dateTime={response.createdAt}>
          {new Date(response.createdAt).toLocaleTimeString(
            locale === "tr" ? "tr-TR" : "en-GB",
            { hour: "2-digit", minute: "2-digit", hour12: false },
          )}
        </time>
      </header>
      <p>{response.value}</p>
    </article>
  );
}
