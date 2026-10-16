"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";
import { LandingWaitlistButton } from "./landing-integrations";

const moments = [
  {
    headline: "Prova yapmana",
    label: "Prova",
    image: "hero-agents-rehearsal.webp",
    alt: "Eğitmenin yapay zekâ katılımcı ajanlarıyla sesli provasını gösteren izometrik sahne",
  },
  {
    headline: "Katılımı artırmana",
    label: "Etkileşim",
    image: "hero-learning-space.webp",
    alt: "Eğitmen ve katılımcılar arasında etkileşimi gösteren izometrik öğrenme alanı",
  },
  {
    headline: "Ölçüp değerlendirmene",
    label: "Değerlendirme",
    image: "hero-agents-assessment.webp",
    alt: "Katılımcı yanıtlarından öğrenme ihtiyaçlarını inceleyen eğitmen ve raporun izometrik görünümü",
  },
] as const;

export function LandingHero() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const [restart, setRestart] = useState(0);
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
    if (reduced || !inView || !visible) return;
    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % moments.length),
      4000,
    );
    return () => window.clearTimeout(timer);
  }, [active, restart, reduced, inView, visible]);

  return (
    <section
      className="landing-hero-frame"
      aria-labelledby="landing-title"
      ref={section}
    >
      <div className="landing-hero landing-container">
        <div className="landing-hero-copy">
          <h1
            id="landing-title"
            aria-label={t(
              "Prova yapmana, katılımı artırmana ve öğrenmeyi değerlendirmene yardımcı olan yapay zekâ ajanları.",
            )}
          >
            <span className="landing-hero-rotator" aria-hidden="true">
              {moments.map((moment, index) => (
                <span key={moment.headline} data-active={index === active}>
                  {t(moment.headline)}
                </span>
              ))}
            </span>
            <span className="landing-hero-suffix" aria-hidden="true">
              {t("yardımcı olan yapay zekâ ajanları.")}
            </span>
          </h1>
          <p className="landing-hero-description">
            {t(
              "Eğitimine hazırlanırken, katılımcılarınla etkileşim kurarken ve öğrenme sonuçlarını değerlendirirken yapay zekâ ajanları yanında.",
            )}
          </p>
          <div className="landing-hero-actions landing-cta-actions">
            <Link
              href="/giris?mod=kayit"
              className="button primary landing-try-button"
            >
              {t("Şimdi dene, ücretsiz")}
              <Icon name="arrow" size={19} />
            </Link>
            <LandingWaitlistButton className="button landing-waitlist-button" />
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-art">
            {moments.map((moment, index) => (
              <div
                key={moment.image}
                className="landing-hero-scene"
                data-active={index === active}
                aria-hidden={index !== active}
              >
                <Image
                  src={`/landing/${moment.image}`}
                  alt={t(moment.alt)}
                  width={1448}
                  height={1086}
                  sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 680px"
                  loading="eager"
                  fetchPriority={index === 0 ? "high" : "low"}
                  unoptimized
                />
              </div>
            ))}
          </div>
          <div
            className="landing-hero-steps"
            role="group"
            aria-label={t("Yapay zekâ ajanlarını keşfet")}
          >
            {moments.map((moment, index) => (
              <button
                type="button"
                key={moment.label}
                aria-pressed={active === index}
                onClick={() => {
                  setActive(index);
                  setRestart((current) => current + 1);
                }}
              >
                <span className="landing-hero-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{t(moment.label)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
