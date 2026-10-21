"use client";
import { isChoiceActivity } from "@/lib/activities";
import { AgentIllustration } from "./agent-identity";
import { useProductLocale as useLocale } from "./product-locale";
import { PreviewSkeleton, ProjectionSkeleton } from "./skeletons";
import { useEffect, useState } from "react";
import { LiveConnection } from "./live-connection";
import { useLiveResource } from "./use-live-resource";
import type { Course, CourseState } from "@/lib/types";
import { Icon, Logo, ResourceFailure, useResource } from "./ui";
import { SlideView } from "./slides";
import { learningAccess } from "@/lib/training-access";

export function Projection({ id }: { id: string }) {
  const { t } = useLocale();

  const [key, setKey] = useState<string | null>(null);
  const [host, setHost] = useState("");
  useEffect(() => {
    setKey(new URLSearchParams(location.search).get("key") || "");
    setHost(location.origin);
  }, []);
  const {
    data: result,
    error,
    refresh,
    checking,
    lastUpdated,
  } = useLiveResource<{
    course: Course;
    joinOrigin?: string;
  }>(
    `presentation/${id}?key=${encodeURIComponent(key || "")}`,
    1000,
    key !== null,
  );
  const data = result?.course;
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={() => void refresh()} />
    ) : (
      <ProjectionSkeleton />
    );
  const slide =
    data.slides.find((s) => s.id === data.activeSlideId) || data.slides[0];
  return (
    <main className="projection">
      <header>
        <span>
          {t("Join:")} <strong>{result?.joinOrigin || host}/join</strong>{" "}
          {t("· Code")} <b>{data.code}</b>
        </span>
        <Logo />
      </header>
      <LiveConnection
        error={error}
        checking={checking}
        lastUpdated={lastUpdated}
        onRetry={() => void refresh()}
        projection
      />
      {data.status === "draft" ? (
        <div className="projection-end projection-waiting">
          <Icon name="clock" size={40} />
          <h1>{t("Waiting for your instructor")}</h1>
          <p>{t("The presentation will appear when training starts.")}</p>
        </div>
      ) : data.status === "ended" ? (
        <div className="projection-end">
          <Icon name="success" size={58} />
          <h1>{t("Thank you for taking part.")}</h1>
          <p>
            {learningAccess(data).canAsk
              ? t(
                  "You can continue asking the learning agent for {days} more days.",
                  { days: learningAccess(data).remainingDays },
                )
              : t("Learning agent access for this training has ended.")}
          </p>
        </div>
      ) : (
        <SlideView course={data} slide={slide} displayKey={key || undefined} />
      )}
      <footer>
        <span>{data.name}</span>
        <span>
          {data.status === "live"
            ? `${data.slides.indexOf(slide) + 1} / ${data.slides.length}`
            : t(
                data.status === "draft"
                  ? "Training has not started"
                  : "Training completed",
              )}
        </span>
        <button
          className="icon-button"
          aria-label={t("Full screen")}
          onClick={() => document.documentElement.requestFullscreen()}
        >
          <Icon name="expand" />
        </button>
      </footer>
    </main>
  );
}
export function Preview({ id }: { id: string }) {
  const { t } = useLocale();

  const { data, error, refresh } = useResource<CourseState>(`courses/${id}`),
    [index, setIndex] = useState(0);
  useEffect(() => {
    if (!data) return;
    const page = Number(new URLSearchParams(location.search).get("slide"));
    const found = data.course.slides.findIndex(
      (slide) =>
        data.course.pages.find((p) => p.id === slide.pageId)?.number === page,
    );
    if (page && found >= 0) setIndex(found);
  }, [data?.course.id]);
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={refresh} />
    ) : (
      <PreviewSkeleton />
    );
  const c = data.course,
    slide = c.slides[index];
  return (
    <div className="preview-page">
      <header>
        <a
          className="icon-button"
          href={`/training/${id}`}
          aria-label={t("Back to training")}
        >
          <Icon name="back" />
        </a>
        <span>
          “<strong>{c.name}</strong>
          {t("” training preview")}
        </span>
        <Logo />
      </header>
      <div className="preview-layout">
        <section>
          <h2>{t("Presentation screen")}</h2>
          <div className="presentation-canvas">
            <div className="canvas-join">
              <span>
                {t("Join code:")} <strong>{c.code}</strong>
              </span>
              <Logo />
            </div>
            <SlideView course={c} slide={slide} />
          </div>
          <div className="slide-controls">
            <button
              className="icon-button"
              disabled={index === 0}
              aria-label={t("Previous slide")}
              onClick={() => setIndex(index - 1)}
            >
              <Icon name="left" />
            </button>
            <span>
              {index + 1} / {c.slides.length}
            </span>
            <button
              className="icon-button"
              disabled={index === c.slides.length - 1}
              aria-label={t("Next slide")}
              onClick={() => setIndex(index + 1)}
            >
              <Icon name="right" />
            </button>
          </div>
        </section>
        <section>
          <h2>{t("Participant screen")}</h2>
          <div className="phone-preview">
            <Logo />
            <div className="participant-tabs">
              <span className={slide.kind === "document" ? "active" : ""}>
                {t("Chat")}
              </span>
              <span className={slide.kind === "activity" ? "active" : ""}>
                {t("Activities")}
              </span>
            </div>
            {slide.activity ? (
              <div className="preview-activity">
                <span className="activity-label">{t("ACTIVE ACTIVITY")}</span>
                <h3>{slide.activity.question}</h3>
                {isChoiceActivity(slide.activity.type) ? (
                  slide.activity.options.map((o, i) => (
                    <div className="preview-option" key={i}>
                      <span>{String.fromCharCode(65 + i)}</span>
                      {o}
                    </div>
                  ))
                ) : (
                  <div className="preview-textarea">
                    {t("Write your answer…")}
                  </div>
                )}
                <div className="button primary full">{t("Submit answer")}</div>
              </div>
            ) : (
              <div className="preview-chat">
                <AgentIllustration kind="learning" />
                <h3>{t("Your learning agent")}</h3>
                <p>
                  {t(
                    "Your learning agent answers from the training materials and links to the source.",
                  )}
                </p>
                <div className="preview-textarea">
                  {t("Ask a question about the training…")}
                </div>
              </div>
            )}
            <span className="small muted center">
              {t("Preview · No real answers are sent")}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
