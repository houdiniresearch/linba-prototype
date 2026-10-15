"use client";
import { useLocale } from "./locale-provider";
import type { Course, Slide } from "@/lib/types";
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
      <img
        className={`slide-image ${small ? "small" : ""}`}
        src={`/api/courses/${course.id}/page/${page.number}${displayKey ? `?key=${displayKey}` : ""}`}
        alt={page.title}
        draggable={false}
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
