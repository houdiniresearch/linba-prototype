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
    title: "Yanıtları topla. Düşünme biçimlerini gör.",
    text: "Açık uçlu bir soruyla öğrencilerinden yazılı yanıtlar al. Yapay zekâ, yanıtlardaki ortak fikirleri ve kavram yanılgılarını özetlesin; sen nerede yeniden açıklama gerektiğini gör.",
    benefit: "Tek tek yanıtların ötesinde, sınıfın nasıl düşündüğünü anla.",
    filename: "Araştırma yöntemleri.pdf",
    summary:
      "Örnek yapay zekâ etkinliği: öğrenciler korelasyon ve nedensellik sorusuna yazılı yanıt verir; yapay zekâ ortak kavram yanılgısını özetler. Önerilen confusion spike özelliği, benzer soruların bir slaytta yoğunlaştığını eğitmene gösterir.",
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

const academicScenes = [
  "Yazılı yanıtlar",
  "Yapay zekâ analizi",
  "Confusion spike",
];

function AudienceDemo({
  kind,
  scene,
}: {
  kind: (typeof audiences)[number]["id"];
  scene: number;
}) {
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
      <div className="audience-academic" data-scene={scene}>
        <div
          className="audience-academic-scene"
          hidden={scene !== 0}
          key="responses"
        >
          <div className="audience-activity-question">
            <span className="audience-message-label">
              <Icon name="activity" size={16} />
              {t("Yapay zekâ etkinliği")}
            </span>
            <strong>{t("Korelasyon, nedensellik anlamına gelir mi?")}</strong>
          </div>
          <div className="audience-written-responses">
            <span className="audience-message-label">
              {t("Örnek yazılı yanıtlar")}
            </span>
            <div>
              <span className="audience-response-avatar">EA</span>
              <p>
                {t("İki değer birlikte artıyorsa biri diğerinin nedenidir.")}
              </p>
            </div>
            <div>
              <span className="audience-response-avatar">MK</span>
              <p>{t("Üçüncü bir etken ikisini de etkiliyor olabilir.")}</p>
            </div>
          </div>
        </div>
        <div
          className="audience-academic-scene"
          hidden={scene !== 1}
          key="analysis"
        >
          <div className="audience-analysis-map">
            <div className="audience-analysis-inputs">
              <Icon name="chat" size={23} />
              <Icon name="chat" size={23} />
              <Icon name="chat" size={23} />
            </div>
            <span className="audience-analysis-connector" />
            <span className="audience-analysis-core">
              <Icon name="sparkle" size={32} />
            </span>
            <span className="audience-analysis-connector" />
            <div className="audience-analysis-groups">
              <span>{t("Ortak fikirler")}</span>
              <span>{t("Kavram yanılgıları")}</span>
            </div>
          </div>
          <div className="audience-response-analysis">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Yapay zekâ analizi")}
            </span>
            <p>
              {t(
                "Bazı yanıtlar, birlikte değişimi doğrudan neden-sonuç ilişkisi olarak yorumluyor.",
              )}
            </p>
          </div>
        </div>
        <div
          className="audience-academic-scene audience-confusion-signal"
          hidden={scene !== 2}
          key="confusion"
        >
          <div className="audience-confusion-heading">
            <strong>Confusion spike</strong>
          </div>
          <p className="audience-confusion-subtitle">
            {t("Kafa karışıklığı sinyali")}
          </p>
          <div className="audience-confusion-detail">
            <svg viewBox="0 0 400 106" aria-hidden="true">
              <path
                d="M8 25H392M8 57H392M8 90H392"
                fill="none"
                stroke="currentColor"
                opacity=".12"
              />
              <path
                d="M8 86L43 83L78 87L113 77L148 80L183 72L218 78L253 65L288 16L323 55L358 68L392 76V98H8Z"
                fill="currentColor"
                opacity=".08"
              />
              <path
                d="M8 86L43 83L78 87L113 77L148 80L183 72L218 78L253 65L288 16L323 55L358 68L392 76"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M288 16V98"
                stroke="currentColor"
                strokeDasharray="3 5"
                opacity=".35"
              />
              <circle
                cx="288"
                cy="16"
                r="11"
                fill="currentColor"
                opacity=".12"
              />
              <circle cx="288" cy="16" r="4" fill="currentColor" />
            </svg>
            <p>{t("Slayt 08 · Benzer sorular bu kavramda yoğunlaşıyor.")}</p>
          </div>
          <span className="audience-confusion-suggestion">
            <Icon name="chat" size={17} />
            {t("Bir karşı örnekle yeniden açıklamayı düşün.")}
          </span>
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
  const [academicScene, setAcademicScene] = useState(0);
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const audience = audiences[selected];

  useEffect(() => {
    if (audience.id !== "academic" || !inView || !visible || paused || reduced)
      return;
    const timer = window.setInterval(
      () => setAcademicScene((current) => (current + 1) % 3),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [audience.id, inView, visible, paused, reduced, academicScene]);

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
            {audience.id === "academic" && (
              <div
                className="audience-scene-controls"
                role="group"
                aria-label={t("Örnek sahneleri")}
              >
                {academicScenes.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={t(label)}
                    aria-pressed={academicScene === index}
                    onClick={() => {
                      setAcademicScene(index);
                      setPaused(true);
                    }}
                  >
                    <span />
                  </button>
                ))}
              </div>
            )}
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
            <AudienceDemo kind={audience.id} scene={academicScene} />
          </div>
          <p className="sr-only">{t(audience.summary)}</p>
        </div>
      </div>
    </section>
  );
}
