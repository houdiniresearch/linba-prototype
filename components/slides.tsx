"use client";
import { useLocale } from "./locale-provider";
import type { Course, Slide, Page } from "@/lib/types";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SlideSkeleton } from "./skeletons";
import { Icon } from "./ui";
import { translate, type Locale } from "@/lib/translations";
export function slideTitle(
  course: Course,
  slide: Slide,
  locale: Locale = "tr",
) {
  return slide.kind === "document"
    ? course.pages.find((p) => p.id === slide.pageId)?.title ||
        translate("Sunum slaytı", locale)
    : slide.activity?.question || translate("Aktivite", locale);
}
export function SlideView({
  course,
  slide,
  displayKey,
  small = false,
}: {
  course: Course;
  slide: Slide;
  displayKey?: string;
  small?: boolean;
}) {
  const { t } = useLocale();

  if (slide.kind === "document") {
    const page = course.pages.find((p) => p.id === slide.pageId);
    if (!page) return null;
    return (
      <DocumentSlide
        key={`${course.id}:${page.number}:${displayKey || ""}`}
        page={page}
        small={small}
        src={`/api/courses/${course.id}/page/${page.number}${displayKey ? `?key=${displayKey}` : ""}`}
      />
    );
  }
  return (
    <div className={`activity-slide ${small ? "small" : ""}`}>
      <div className="activity-slide-label">
        <Icon name={slide.activity?.type === "poll" ? "chart" : "chat"} />
        {slide.activity?.type === "poll"
          ? t("Anket")
          : slide.activity?.type === "scenario"
            ? t("Senaryo")
            : t("Açık uçlu soru")}
        {slide.activity?.aiGenerated && <span>{t("· AI ile hazırlandı")}</span>}
      </div>
      <h2>{slide.activity?.question}</h2>
      {slide.activity?.type === "poll" ? (
        <div className="poll-options">
          {slide.activity.options.map((o, i) => (
            <div key={i}>
              <span>{String.fromCharCode(65 + i)}</span>
              {o}
            </div>
          ))}
        </div>
      ) : (
        <p>{t("Yanıtını telefonundaki Aktiviteler alanından paylaş.")}</p>
      )}
      <span className="slide-footer">{t("linba · Birlikte öğrenelim")}</span>
    </div>
  );
}

function DocumentSlide({
  page,
  src,
  small,
}: {
  page: Page;
  src: string;
  small: boolean;
}) {
  const { t } = useLocale();
  const image = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    if (image.current?.complete) {
      if (image.current.naturalWidth > 0) setReady(true);
      else setFailed(true);
    }
  }, []);
  const ratio =
    Number.isFinite(page.ratio) && page.ratio > 0 ? page.ratio : 16 / 9;
  return (
    <div
      className={`slide-frame ${small ? "small" : ""}`}
      style={{ "--slide-ratio": ratio } as CSSProperties}
    >
      {!ready && !failed && <SlideSkeleton small={small} />}
      <img
        ref={image}
        className={`slide-image ${ready ? "is-ready" : ""}`}
        src={src}
        alt={page.title}
        aria-hidden={!ready || undefined}
        draggable={false}
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      {failed && (
        <div
          className="slide-image-error"
          role={small ? undefined : "alert"}
          aria-hidden={small || undefined}
        >
          <Icon name="warning" />
          {!small && <span>{t("Slayt görseli yüklenemedi.")}</span>}
        </div>
      )}
    </div>
  );
}
