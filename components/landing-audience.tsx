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
    scenes: ["Kitleyi tanı", "Sesli prova", "Geri bildirim"],
    summary:
      "Örnek prova: eğitmen kitlesini tarif eder, sunumunu sesli anlatır ve yapay zekâ katılımcısının fiyat sorusuna hazırlanmak için geri bildirim alır.",
  },
  {
    id: "academic",
    label: "Öğretim görevlisi",
    title: "Yanıtları topla. Düşünme biçimlerini gör.",
    text: "Açık uçlu bir soruyla öğrencilerinden yazılı yanıtlar al. Yapay zekâ, yanıtlardaki ortak fikirleri ve kavram yanılgılarını özetlesin; sen nerede yeniden açıklama gerektiğini gör.",
    benefit: "Tek tek yanıtların ötesinde, sınıfın nasıl düşündüğünü anla.",
    filename: "Araştırma yöntemleri.pdf",
    scenes: ["Yanıtlar", "AI analizi", "Confusion spike"],
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
    scenes: ["Sorunu sor", "Yanıtı keşfet", "Kaynağa dön"],
    summary:
      "Örnek eğitim sonrası sohbet: katılımcı aktif dinlemeyi sorar; asistan sunumdaki açıklama ve kaynak slaytla yanıt verir.",
  },
  {
    id: "institution",
    label: "Eğitim kurumları",
    title: "Öğrencilerini anla. Sonraki eğitimi geliştir.",
    text: "Eğitim raporunu asistanınla birlikte incele. Öğrencilerin hangi konularda zorlandığını sor, öğrenme ihtiyaçlarını keşfet ve sonraki eğitimini bu içgörülerle planla.",
    benefit: "Öğrencilerinin sorularını somut eğitim kararlarına dönüştür.",
    filename: "Araştırma yöntemleri · Eğitim raporu",
    scenes: ["Raporu aç", "Zorlanılan konular", "Sonraki eğitim"],
    summary:
      "Örnek rapor asistanı: kurum, öğrencilerin korelasyon ve nedensellik hakkında sorduğu soruları inceler. Asistana nerede zorlandıklarını ve sonraki eğitimde neyi geliştirebileceğini sorar; rapora dayalı açıklama ve bir karşı örnek önerisi alır.",
  },
] as const;

function AudienceDemo({
  kind,
  scene,
}: {
  kind: (typeof audiences)[number]["id"];
  scene: number;
}) {
  const { t } = useLocale();
  if (kind === "institution")
    return (
      <div className="audience-demo-stage" data-scene={scene}>
        <div className="audience-demo-scene" data-active={scene === 0}>
          <span className="audience-message-label">
            <Icon name="chart" size={16} />
            {t("Örnek eğitim raporu")}
          </span>
          <h4 className="audience-scene-title">
            {t("Öğrencilerden gelen sorular")}
          </h4>
          <div className="audience-report-questions">
            <p>
              <Icon name="chat" size={17} />
              <span>
                {t("Birlikte artıyorlarsa biri diğerinin nedeni değil mi?")}
              </span>
            </p>
            <p>
              <Icon name="chat" size={17} />
              <span>{t("Üçüncü bir etken olduğunu nasıl anlarız?")}</span>
            </p>
          </div>
          <div className="audience-demo-note">
            <Icon name="file" size={17} />
            <span>{t("Slayt 08 · Korelasyon ve nedensellik")}</span>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-report-conversation"
          data-active={scene === 1}
        >
          <div className="audience-chat-question">
            {t("Öğrenciler en çok hangi konuda zorlandı?")}
          </div>
          <div className="audience-chat-answer">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Rapor asistanı")}
            </span>
            <p>
              {t(
                "Sorular, korelasyon ile neden-sonuç ilişkisini ayırt etmede zorlanıldığını gösteriyor.",
              )}
            </p>
            <div className="audience-source">
              <Icon name="chart" size={17} />
              {t("Dayanak: eğitimde sorulan sorular")}
            </div>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-report-conversation"
          data-active={scene === 2}
        >
          <div className="audience-chat-question">
            {t("Bir sonraki eğitimde neyi geliştirebilirim?")}
          </div>
          <div className="audience-chat-answer">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Rapor asistanı")}
            </span>
            <p>
              {t(
                "Bu kavramı bir karşı örnekle yeniden ele al. Ardından kısa bir açık uçlu soruyla öğrencilerin gerekçelerini karşılaştır.",
              )}
            </p>
            <div className="audience-report-next">
              <Icon name="presentation" size={19} />
              <span>
                {t("Karşı örnek → Açık uçlu soru → Birlikte tartışma")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  if (kind === "corporate")
    return (
      <div className="audience-demo-stage" data-scene={scene}>
        <div className="audience-demo-scene" data-active={scene === 0}>
          <span className="audience-message-label">
            <Icon name="users" size={16} />
            {t("Prova kitlen")}
          </span>
          <h4 className="audience-scene-title">{t("Kitleni tarif et.")}</h4>
          <p className="audience-scene-description">
            {t("Yeni başlayan bir ekibe ürün eğitimi.")}
          </p>
          <div className="audience-persona-list">
            <div>
              <span>EA</span>
              <p>
                <strong>Ece</strong>
                <small>{t("Yeni başlayan")}</small>
              </p>
            </div>
            <div>
              <span>MK</span>
              <p>
                <strong>Mert</strong>
                <small>{t("Müşteri temsilcisi")}</small>
              </p>
            </div>
            <div>
              <span>SY</span>
              <p>
                <strong>Selin</strong>
                <small>{t("Meraklı katılımcı")}</small>
              </p>
            </div>
          </div>
        </div>
        <div className="audience-demo-scene" data-active={scene === 1}>
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
          <div className="audience-demo-note">
            <Icon name="mic" size={17} />
            <span>{t("Anlatımını sesli dene.")}</span>
          </div>
        </div>
        <div className="audience-demo-scene" data-active={scene === 2}>
          <div className="audience-demo-message">
            <span className="audience-message-label">
              {t("Ece · Yeni başlayan")}
            </span>
            <p>{t("Müşteri doğrudan fiyatı sorarsa nasıl ilerlemeliyim?")}</p>
          </div>
          <div className="audience-rehearsal-feedback">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Prova geri bildirimi")}
            </span>
            <p>{t("Önce ihtiyacı sor, sonra fiyatı bağlama oturt.")}</p>
            <div className="audience-demo-note">
              <Icon name="check" size={17} />
              <span>{t("Soruyu karşıla. Anlatımını sürdür.")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  if (kind === "academic")
    return (
      <div className="audience-demo-stage" data-scene={scene}>
        <div
          className="audience-demo-scene"
          data-active={scene === 0}
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
          className="audience-demo-scene"
          data-active={scene === 1}
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
          className="audience-demo-scene audience-confusion-signal"
          data-active={scene === 2}
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
    <div className="audience-demo-stage" data-scene={scene}>
      <div className="audience-demo-scene" data-active={scene === 0}>
        <span className="audience-message-label">
          <Icon name="clock" size={16} />
          {t("Eğitimden sonra")}
        </span>
        <h4 className="audience-scene-title">{t("Bir soru daha.")}</h4>
        <p className="audience-scene-description">
          {t("Sunumun, sorulara açık kalsın.")}
        </p>
        <div className="audience-followup-question">
          <span className="audience-response-avatar">MK</span>
          <div className="audience-chat-question">
            {t("Aktif dinlemeyi bir örnekle açıklar mısın?")}
          </div>
        </div>
      </div>
      <div className="audience-demo-scene" data-active={scene === 1}>
        <div className="audience-chat-answer">
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("Sunumuna dayanan asistan")}
          </span>
          <p>
            {t(
              "Karşındaki kişiyi kendi cümlelerinle özetlemek, doğru anlayıp anlamadığını kontrol etmene yardımcı olur.",
            )}
          </p>
          <div className="audience-source">
            <Icon name="file" size={17} />
            {t("Slayt 12 · Aktif dinleme")}
            <Icon name="arrow" size={14} />
          </div>
        </div>
      </div>
      <div className="audience-demo-scene" data-active={scene === 2}>
        <span className="audience-message-label">
          <Icon name="file" size={16} />
          {t("Kaynağa geri dön.")}
        </span>
        <div className="audience-mini-slide audience-source-slide">
          <span>{t("Aktif dinleme")}</span>
          <p>{t("Önce dinle. Sonra kendi cümlelerinle özetle.")}</p>
          <div className="audience-slide-rule" />
          <span className="audience-slide-caption">12 / 18</span>
        </div>
        <div className="audience-demo-note">
          <Icon name="clock" size={17} />
          <span>{t("Erişim süresini sen belirlersin.")}</span>
        </div>
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
  const [scene, setScene] = useState(0);
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const audience = audiences[selected];
  const selectAudience = (index: number) => {
    setSelected(index);
    setScene(0);
    setPaused(false);
  };

  useEffect(() => {
    if (!inView || !visible || paused || reduced) return;
    const timer = window.setInterval(
      () => setScene((current) => (current + 1) % 3),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [audience.id, inView, visible, paused, reduced, scene]);

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
          selectAudience(next);
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
            onClick={() => selectAudience(index)}
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
            <AudienceDemo kind={audience.id} scene={scene} />
          </div>
          <div
            className="audience-scene-controls"
            role="group"
            aria-label={t("Örnek sahneleri")}
          >
            {audience.scenes.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-label={`${index + 1}. ${t(label)}`}
                aria-pressed={scene === index}
                onClick={() => {
                  setScene(index);
                  setPaused(true);
                }}
              >
                <span className="audience-scene-number">{index + 1}</span>
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
          <p className="sr-only">{t(audience.summary)}</p>
        </div>
      </div>
    </section>
  );
}
