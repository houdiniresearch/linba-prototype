"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";

const moments = [
  { headline: "hazırlıklı başla.", label: "Prova yap", icon: "mic" },
  { headline: "herkesi dahil et.", label: "Etkileşim kur", icon: "activity" },
  { headline: "öğrenmeyi sürdür.", label: "Öğrenmeyi sürdür", icon: "chat" },
] as const;

export function LandingHero() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const [restart, setRestart] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    if (section.current) observer.observe(section.current);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (reduced || paused || !inView || !visible) return;
    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % moments.length),
      4000,
    );
    return () => window.clearTimeout(timer);
  }, [active, restart, reduced, paused, inView, visible]);

  return (
    <section
      className="landing-hero-frame"
      aria-labelledby="landing-title"
      ref={section}
    >
      <div className="landing-hero landing-container">
        <div className="landing-hero-copy">
          <p className="landing-hero-intro">
            {t("Sunumdan birlikte öğrenmeye.")}
          </p>
          <h1
            id="landing-title"
            aria-label={t(
              "Bir sunumla hazırlıklı başla, herkesi dahil et, öğrenmeyi sürdür.",
            )}
          >
            <span className="landing-hero-prefix" aria-hidden="true">
              {t("Bir sunumla,")}
            </span>
            <span className="landing-hero-rotator" aria-hidden="true">
              {moments.map((moment, index) => (
                <span key={moment.headline} data-active={index === active}>
                  {t(moment.headline)}
                </span>
              ))}
            </span>
          </h1>
          <p className="landing-hero-description">
            {t(
              "Sunumunu yükle. Yapay zekâyla prova yap, eğitim sırasında etkileşim kur ve sonrasında öğrenmeyi sürdür.",
            )}
          </p>
          <div className="landing-hero-actions">
            <Link href="/giris?mod=kayit" className="button primary">
              {t("Ücretsiz başla")}
              <Icon name="arrow" size={19} />
            </Link>
            <a href="#kimler-icin" className="landing-hero-explore">
              {t("Senaryoları keşfet")}
              <Icon name="down" size={17} />
            </a>
          </div>
          <p className="landing-hero-format">
            {t("PDF ve PPTX sunumlarınla çalışır.")}
          </p>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-art">
            <Image
              src="/landing/hero-learning-space.webp"
              alt={t(
                "Katlanmış bir sunum sayfasının oluşturduğu öğrenme alanında eğitmen ve üç katılımcı",
              )}
              width={1448}
              height={1086}
              sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 680px"
              loading="eager"
              fetchPriority="high"
              unoptimized
            />
          </div>
          <div className="landing-hero-controls">
            <div
              className="landing-hero-moments"
              role="group"
              aria-label={t("Eğitimin üç aşaması")}
            >
              {moments.map((moment, index) => (
                <button
                  key={moment.label}
                  type="button"
                  aria-pressed={active === index}
                  onClick={() => {
                    setActive(index);
                    setRestart((current) => current + 1);
                  }}
                >
                  <Icon name={moment.icon} size={17} />
                  <span>{t(moment.label)}</span>
                </button>
              ))}
            </div>
            {!reduced && (
              <button
                className="landing-hero-playback"
                type="button"
                onClick={() => setPaused((current) => !current)}
                aria-pressed={paused}
                aria-label={t(
                  paused
                    ? "Açılış animasyonunu oynat"
                    : "Açılış animasyonunu duraklat",
                )}
              >
                <Icon name={paused ? "play" : "pause"} size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
