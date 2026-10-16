"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";
import { LandingWaitlistButton } from "./landing-integrations";

const moments = [
  "Prova yapmana",
  "Katılımı artırmana",
  "Öğrenmeyi sürdürmene",
] as const;

export function LandingHero() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
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
      3000,
    );
    return () => window.clearTimeout(timer);
  }, [active, reduced, inView, visible]);

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
              "Prova yapmana, katılımı artırmana ve öğrenmeyi sürdürmene yardımcı olan yapay zekâ.",
            )}
          >
            <span className="landing-hero-rotator" aria-hidden="true">
              {moments.map((moment, index) => (
                <span key={moment} data-active={index === active}>
                  {t(moment)}
                </span>
              ))}
            </span>
            <span className="landing-hero-suffix" aria-hidden="true">
              {t("yardımcı olan yapay zekâ.")}
            </span>
          </h1>
          <p className="landing-hero-description">
            {t(
              "Sunumunu yükle. Yapay zekâyla prova yap, eğitim sırasında etkileşim kur ve sonrasında öğrenmeyi sürdür.",
            )}
          </p>
          <div className="landing-hero-actions">
            <Link href="/giris?mod=kayit" className="button primary">
              {t("Ücretsiz dene")}
              <Icon name="arrow" size={19} />
            </Link>
            <LandingWaitlistButton className="button landing-hero-waitlist" />
          </div>
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
        </div>
      </div>
    </section>
  );
}
