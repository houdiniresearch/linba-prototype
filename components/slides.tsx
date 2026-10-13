"use client";
import type { Course, Slide } from "@/lib/types";
import { Icon } from "./ui";
export function slideTitle(course: Course, slide: Slide) {
  return slide.kind === "document"
    ? course.pages.find((p) => p.id === slide.pageId)?.title || "Sunum slaytı"
    : slide.activity?.question || "Aktivite";
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
          ? "Anket"
          : slide.activity?.type === "scenario"
            ? "Senaryo"
            : "Açık uçlu soru"}
        {slide.activity?.aiGenerated && <span>· AI ile hazırlandı</span>}
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
        <p>Yanıtını telefonundaki Aktiviteler alanından paylaş.</p>
      )}
      <span className="slide-footer">linba · Birlikte öğrenelim</span>
    </div>
  );
}
