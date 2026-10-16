"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "./locale-provider";
import { Icon } from "./ui";
import "./landing-audience.css";

const audiences = [
  {
    id: "corporate",
    label: "Kurumsal eğitmen",
    title: "Yeni bir ekibe, hazırlıklı bir başlangıç.",
    text: "Ürün eğitimini yeni başlayanlara anlatmadan önce kitleni tarif et. Farklı deneyimlere sahip yapay zekâ katılımcılarının sorularıyla anlatımını dene.",
    benefit: "Katılımcılarının sorularına hazırlıklı gir.",
    filename: "Ürün eğitimi.pdf",
    summary:
      "Örnek prova: eğitmen ürününü anlatırken yeni başlayan bir katılımcı fiyat sorusunu nasıl ele alacağını sorar.",
  },
  {
    id: "academic",
    label: "Öğretim görevlisi",
    title: "Anlattığın konu, birlikte düşünülen bir soruya dönüşsün.",
    text: "Sunumuna kısa bir aktivite yerleştir. O slayta geldiğinde öğrenciler telefonlarından yanıtlasın; sorularıyla derse katılsın.",
    benefit: "Katılımı dersinin doğal bir parçası yap.",
    filename: "Veri okuryazarlığı.pdf",
    summary:
      "Örnek ders içi aktivite: slayttaki grafik sorusu öğrencinin telefonunda açılır ve öğrenci yanıtını gönderir.",
  },
  {
    id: "independent",
    label: "Bağımsız eğitimci",
    title: "Atölyen bitsin. Öğrenme devam etsin.",
    text: "Atölyenden sonra da katılımcılarına sunumunla öğrenme alanı bırak. Belirlediğin süre boyunca sorularını sorsunlar, kaynak slaytlara geri dönebilsinler.",
    benefit: "Bilgiyi ihtiyaç duydukları anda erişilebilir tut.",
    filename: "Etkili iletişim atölyesi.pdf",
    summary:
      "Örnek eğitim sonrası sohbet: katılımcı aktif dinlemeyi sorar; asistan sunumdaki açıklama ve kaynak slaytla yanıt verir.",
  },
] as const;

function AudienceDemo({ kind }: { kind: (typeof audiences)[number]["id"] }) {
  const { t } = useLocale();
  if (kind === "corporate")
    return (
      <div className="audience-rehearsal">
        <div className="audience-mini-slide">
          <span>{t("Müşteriyi tanımakla başla.")}</span>
          <p>{t("İhtiyacı anla. Doğru soruyu sor.")}</p>
          <div className="audience-slide-rule" />
          <span className="audience-slide-caption">01 / 08</span>
        </div>
        <div className="audience-voice-row">
          <div className="audience-personas">
            <span>EA</span>
            <span>MK</span>
            <span>SY</span>
          </div>
          <div className="audience-wave">
            {[8, 17, 12, 25, 18, 30, 14, 23, 10, 18, 26, 12].map(
              (height, index) => (
                <i
                  key={index}
                  style={{ height, animationDelay: `${index * -0.11}s` }}
                />
              ),
            )}
          </div>
          <Icon name="mic" size={18} />
        </div>
        <div className="audience-demo-message audience-arrival-one">
          <span className="audience-message-label">
            {t("Ece · Yeni başlayan")}
          </span>
          <p>{t("Müşteri doğrudan fiyatı sorarsa nasıl ilerlemeliyim?")}</p>
        </div>
        <div className="audience-demo-note audience-arrival-two">
          <Icon name="chat" size={17} />
          <span>{t("Soruyu karşıla. Anlatımını sürdür.")}</span>
        </div>
      </div>
    );
  if (kind === "academic")
    return (
      <div className="audience-classroom">
        <div className="audience-chart-slide">
          <span>{t("Grafiği nasıl yorumlarsın?")}</span>
          <div className="audience-chart">
            <i />
            <i />
            <i />
            <i />
          </div>
          <p>{t("Veriden bir çıkarım yap.")}</p>
        </div>
        <div className="audience-phone audience-arrival-one">
          <div className="audience-phone-speaker" />
          <span className="audience-message-label">{t("Sıra sende")}</span>
          <strong>{t("Grafikte nasıl bir değişim var?")}</strong>
          <div className="audience-option">
            <span>A</span>
            {t("Azalıyor")}
          </div>
          <div className="audience-option audience-option-selected">
            <span>B</span>
            {t("Artıyor")}
            <Icon name="check" size={16} />
          </div>
          <div className="audience-option">
            <span>C</span>
            {t("Değişmiyor")}
          </div>
          <div className="audience-sent audience-arrival-two">
            <Icon name="check" size={16} />
            {t("Yanıtın gönderildi")}
          </div>
        </div>
      </div>
    );
  return (
    <div className="audience-followup">
      <div className="audience-chat-question">
        {t("Aktif dinlemeyi bir örnekle açıklar mısın?")}
      </div>
      <div className="audience-chat-answer audience-arrival-one">
        <span className="audience-message-label">
          <Icon name="sparkle" size={16} />
          {t("Sunumuna dayanan asistan")}
        </span>
        <p>
          {t(
            "Karşındaki kişiyi kendi cümlelerinle özetlemek, doğru anlayıp anlamadığını kontrol etmene yardımcı olur.",
          )}
        </p>
        <div className="audience-source audience-arrival-two">
          <Icon name="file" size={17} />
          {t("Slayt 12 · Aktif dinleme")}
          <Icon name="arrow" size={14} />
        </div>
      </div>
      <div className="audience-demo-note audience-arrival-three">
        <Icon name="clock" size={17} />
        <span>{t("Erişim süresini sen belirlersin.")}</span>
      </div>
    </div>
  );
}

export function LandingAudience() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const audience = audiences[selected];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.12 },
    );
    if (section.current) observer.observe(section.current);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
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

  return (
    <section
      className="landing-audience landing-container"
      id="kimler-icin"
      aria-labelledby={`${id}-title`}
      ref={section}
    >
      <div className="audience-heading">
        <h2 id={`${id}-title`}>{t("Senin eğitimine göre.")}</h2>
        <p>
          {t(
            "Farklı kitleler, farklı ihtiyaçlar. Aynı sunumdan başlayan bir eğitim alanı.",
          )}
        </p>
      </div>
      <div
        className="audience-tabs"
        role="tablist"
        aria-label={t("Eğitmen profilleri")}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? audiences.length - 1
                : (selected +
                    (event.key === "ArrowRight" ? 1 : -1) +
                    audiences.length) %
                  audiences.length;
          setSelected(next);
          tabs.current[next]?.focus();
        }}
      >
        {audiences.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={selected === index}
            aria-controls={`${id}-panel`}
            tabIndex={selected === index ? 0 : -1}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            onClick={() => setSelected(index)}
          >
            {t(item.label)}
          </button>
        ))}
      </div>
      <div
        className="audience-panel"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${selected}`}
        tabIndex={0}
      >
        <div className="audience-copy" key={`${audience.id}-copy`}>
          <h3>{t(audience.title)}</h3>
          <p>{t(audience.text)}</p>
          <div className="audience-benefit">
            <Icon name="check" size={19} />
            <span>{t(audience.benefit)}</span>
          </div>
        </div>
        <div
          className="audience-preview"
          data-running={inView && visible && !paused && !reduced}
          data-motion={inView && !reduced}
          data-paused={paused}
        >
          <div className="audience-preview-toolbar">
            <span>{t("Örnek senaryo")}</span>
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused(!paused)}
                aria-label={t(
                  paused ? "Animasyonu oynat" : "Animasyonu duraklat",
                )}
                aria-pressed={paused}
              >
                <Icon name={paused ? "play" : "pause"} size={17} />
              </button>
            )}
          </div>
          <div
            className="audience-demo-window"
            key={audience.id}
            aria-hidden="true"
          >
            <div className="audience-demo-header">
              <Icon name="file" size={18} />
              <span>{t(audience.filename)}</span>
              <span className="audience-window-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
            <AudienceDemo kind={audience.id} />
          </div>
          <p className="sr-only">{t(audience.summary)}</p>
        </div>
      </div>
    </section>
  );
}
