"use client";
import { useLocale } from "./locale-provider";
import { PreviewSkeleton, ProjectionSkeleton } from "./skeletons";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Course, CourseState } from "@/lib/types";
import { api, Icon, Logo, ResourceFailure, useResource } from "./ui";
import { SlideView } from "./slides";

export function Projection({ id }: { id: string }) {
  const { t } = useLocale();

  const [data, setData] = useState<Course>(),
    [key, setKey] = useState(""),
    [error, setError] = useState(""),
    [host, setHost] = useState("");
  useEffect(() => {
    const k = new URLSearchParams(location.search).get("key") || "";
    setKey(k);
    setHost(location.origin);
    let stopped = false,
      timer: ReturnType<typeof setTimeout>;
    async function tick() {
      try {
        const result = await api(
          `presentation/${id}?key=${encodeURIComponent(k)}`,
        );
        if (!stopped) {
          setData(result.course);
          setHost(result.joinOrigin || window.location.origin);
        }
      } catch (e) {
        if (!stopped) setError((e as Error).message);
      }
      if (!stopped) timer = setTimeout(tick, 1000);
    }
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id]);
  if (!data)
    return error ? (
      <ResourceFailure error={error} onRetry={() => location.reload()} />
    ) : (
      <ProjectionSkeleton />
    );
  const slide =
    data.slides.find((s) => s.id === data.activeSlideId) || data.slides[0];
  return (
    <main className="projection">
      <header>
        <span>
          {t("Katıl:")} <strong>{host}/katil</strong> {t("· Kod")}{" "}
          <b>{data.code}</b>
        </span>
        <Logo />
      </header>
      {data.status === "ended" ? (
        <div className="projection-end">
          <Icon name="success" size={58} />
          <h1>{t("Katılımın için teşekkürler.")}</h1>
          <p>
            {t("Eğitimin tamamlandı. Doküman asistanına")} {data.accessDays}{" "}
            {t("gün erişebilirsin.")}
          </p>
        </div>
      ) : (
        <SlideView course={data} slide={slide} displayKey={key} />
      )}
      <footer>
        <span>{data.name}</span>
        <span>
          {data.slides.indexOf(slide) + 1} / {data.slides.length}
        </span>
        <button
          className="icon-button"
          aria-label={t("Tam ekran")}
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
          href={`/egitim/${id}`}
          aria-label={t("Eğitime dön")}
        >
          <Icon name="back" />
        </a>
        <span>
          “<strong>{c.name}</strong>
          {t("” eğitiminin önizlemesi")}
        </span>
        <Logo />
      </header>
      <div className="preview-layout">
        <section>
          <h2>{t("Yansıtılan ekran")}</h2>
          <div className="presentation-canvas">
            <div className="canvas-join">
              <span>
                {t("Katılım kodu:")} <strong>{c.code}</strong>
              </span>
              <Logo />
            </div>
            <SlideView course={c} slide={slide} />
          </div>
          <div className="slide-controls">
            <button
              className="icon-button"
              disabled={index === 0}
              aria-label={t("Önceki slayt")}
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
              aria-label={t("Sonraki slayt")}
              onClick={() => setIndex(index + 1)}
            >
              <Icon name="right" />
            </button>
          </div>
        </section>
        <section>
          <h2>{t("Katılımcı ekranı")}</h2>
          <div className="phone-preview">
            <Logo />
            <div className="participant-tabs">
              <span className={slide.kind === "document" ? "active" : ""}>
                {t("Sohbet")}
              </span>
              <span className={slide.kind === "activity" ? "active" : ""}>
                {t("Aktiviteler")}
              </span>
            </div>
            {slide.activity ? (
              <div className="preview-activity">
                <span className="activity-label">{t("AKTİF AKTİVİTE")}</span>
                <h3>{slide.activity.question}</h3>
                {slide.activity.type === "poll" ? (
                  slide.activity.options.map((o, i) => (
                    <div className="preview-option" key={i}>
                      <span>{String.fromCharCode(65 + i)}</span>
                      {o}
                    </div>
                  ))
                ) : (
                  <div className="preview-textarea">{t("Yanıtını yaz…")}</div>
                )}
                <div className="button primary full">
                  {t("Yanıtımı gönder")}
                </div>
              </div>
            ) : (
              <div className="preview-chat">
                <span className="assistant-avatar">
                  <Icon name="sparkle" />
                </span>
                <h3>{t("Sunumun içinden, soruna yanıt.")}</h3>
                <p>
                  {t("Bu eğitimin dokümanına ilişkin sorularını sorabilirsin.")}
                </p>
                <div className="preview-textarea">
                  {t("Eğitimle ilgili sorunu yaz…")}
                </div>
              </div>
            )}
            <span className="small muted center">
              {t("Önizleme · Gerçek yanıt gönderilmez")}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
