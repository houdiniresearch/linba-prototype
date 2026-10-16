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
    text: "Ürün eğitimini yeni başlayanlara anlatmadan önce kitleni tarif et. Katılımcılarını temsil eden yapay zekâ ajanlarıyla sesli prova yap; anlatımın, tempon ve sorulara verdiğin yanıtlar hakkında geri bildirim al.",
    benefit: "Katılımcılarının sorularına hazırlıklı gir.",
    filename: "Ürün eğitimi.pdf",
    scenes: ["Kitleyi tanı", "Sesli prova", "Geri bildirim"],
    summary:
      "Örnek prova: eğitmen kitlesini tarif eder ve katılımcıları temsil eden yapay zekâ ajanlarıyla sesli prova yapar. Prova sonrasında anlatımının netliği, temposu ve sorulara verdiği yanıtlarla ilgili performans geri bildirimi alır.",
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
    filename: "Zaman yönetimi atölyesi.pdf",
    scenes: ["Sorunu sor", "Yanıtı keşfet", "Kaynağa dön"],
    summary:
      "Örnek eğitim sonrası sohbet: atölye bittikten sonra katılımcı, hocanın anlattığı önemli ve acil iş ayrımını bir örnekle açıklamasını ister. Asistan sunuma dayalı yanıt verir ve ilgili slaydı gösterir.",
  },
  {
    id: "institution",
    label: "Eğitim kurumları",
    title: "Öğrenci davranışlarını anlayın. Eğitimlerinizi geliştirin.",
    text: "Öğrencilerimiz en çok hangi konularda zorlanıyor? Sonraki eğitimlerde neleri iyileştirebiliriz? Rapor asistanınızla katılımı, etkinlik yanıtlarını ve öğrenci davranışlarını birlikte değerlendirin.",
    benefit: "Her eğitimden, bir sonraki eğitim için yol haritası çıkarın.",
    filename: "Araştırma yöntemleri · Eğitim raporu",
    scenes: ["Eğitim raporu", "Öğrenme ihtiyaçları", "Sonraki eğitim"],
    summary:
      "Örnek kurum raporu: 15 Ekim 2026 tarihli Araştırma yöntemleri eğitimi için katılım, etkinlik yanıtları ve öğrenci davranışları ele alınır. Kurum, öğrencilerinin en çok hangi konularda zorlandığını ve sonraki eğitimlerde neleri iyileştirebileceğini rapor asistanına sorar.",
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
        <div
          className="audience-demo-scene audience-report-cover"
          data-active={scene === 0}
        >
          <span className="audience-report-cover-icon">
            <Icon name="chart" size={36} />
          </span>
          <span className="audience-message-label">{t("Eğitim raporu")}</span>
          <h4 className="audience-scene-title">{t("Araştırma yöntemleri")}</h4>
          <p className="audience-report-date">
            {t("15 Ekim 2026 · Tamamlanan eğitim")}
          </p>
          <div className="audience-report-contents">
            <span>
              <Icon name="users" size={18} />
              {t("Öğrenci katılımı")}
            </span>
            <span>
              <Icon name="activity" size={18} />
              {t("Etkinlik yanıtları")}
            </span>
            <span>
              <Icon name="chart" size={18} />
              {t("Öğrenci davranışları")}
            </span>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-report-conversation"
          data-active={scene === 1}
        >
          <div className="audience-chat-question">
            {t("Öğrencilerimiz en çok hangi konularda zorlanıyor?")}
          </div>
          <div className="audience-chat-answer">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Rapor asistanı")}
            </span>
            <p>
              {t(
                "Etkinlik yanıtları, korelasyon ile nedensellik ayrımında güçlük yaşandığına işaret ediyor.",
              )}
            </p>
            <div className="audience-source">
              <Icon name="chart" size={17} />
              {t("Dayanak: etkinlik yanıtları ve eğitim raporu")}
            </div>
          </div>
        </div>
        <div
          className="audience-demo-scene audience-report-conversation"
          data-active={scene === 2}
        >
          <div className="audience-chat-question">
            {t("Sonraki eğitimlerde neleri iyileştirebiliriz?")}
          </div>
          <div className="audience-chat-answer">
            <span className="audience-message-label">
              <Icon name="sparkle" size={16} />
              {t("Rapor asistanı")}
            </span>
            <p>
              {t(
                "Korelasyon ve nedensellik bölümüne karşı örnekler ekleyin. Kısa etkinliklerle öğrencilerin kavramı nasıl uyguladığını izleyin.",
              )}
            </p>
            <div className="audience-report-next">
              <Icon name="presentation" size={19} />
              <span>{t("Karşı örnekler → Uygulama → Geri bildirim")}</span>
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
            <Icon name="sparkle" size={16} />
            {t("Yapay zekâ katılımcı ajanları")}
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
            <span>{t("Yapay zekâ ajanlarıyla sesli prova.")}</span>
          </div>
        </div>
        <div className="audience-demo-scene" data-active={scene === 2}>
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("Prova performansın")}
          </span>
          <h4 className="audience-scene-title">
            {t("Anlatımına dışarıdan bak.")}
          </h4>
          <div className="audience-performance-point">
            <Icon name="check" size={18} />
            <p>{t("Ana fikri net aktardın ve soruyu doğrudan yanıtladın.")}</p>
          </div>
          <div className="audience-performance-point">
            <Icon name="mic" size={18} />
            <p>
              {t(
                "Örnek verirken hızlandın. Kritik noktadan sonra kısa bir duraklama bırak.",
              )}
            </p>
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
        <h4 className="audience-scene-title">{t("Eğitimden sonra da sor.")}</h4>
        <p className="audience-scene-description">
          {t("Atölyede geçen bir konuyu yeniden keşfet.")}
        </p>
        <div className="audience-followup-question">
          <span className="audience-response-avatar">MK</span>
          <div className="audience-chat-question">
            {t(
              "Hocanın anlattığı önemli ve acil iş ayrımını bir örnekle açıklar mısın?",
            )}
          </div>
        </div>
      </div>
      <div className="audience-demo-scene" data-active={scene === 1}>
        <div className="audience-chat-answer">
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("Eğitim sonrası asistanı")}
          </span>
          <p>
            {t(
              "Önemli bir iş seni hedefine yaklaştırır; acil bir iş ise hemen ilgi ister. Yarınki toplantıya hazırlanmak hem önemli hem acildir. Gelecek ayın planını yapmak önemlidir ama henüz acil değildir.",
            )}
          </p>
          <div className="audience-source">
            <Icon name="file" size={17} />
            {t("Slayt 06 · Önemli ve acil işler")}
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
          <span>{t("Önemli mi, acil mi?")}</span>
          <p>{t("Önemli: hedefe katkısı. Acil: zaman baskısı.")}</p>
          <div className="audience-slide-rule" />
          <span className="audience-slide-caption">06 / 12</span>
        </div>
        <div className="audience-demo-note">
          <Icon name="clock" size={17} />
          <span>{t("Eğitim sonrası erişimi sen belirlersin.")}</span>
        </div>
      </div>
    </div>
  );
}

export function LandingAudience() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [scene, setScene] = useState(0);
  const [sceneRestart, setSceneRestart] = useState(0);
  const section = useRef<HTMLElement>(null);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const audience = audiences[selected];
  const selectScene = (index: number) => {
    setScene(index);
    setSceneRestart((current) => current + 1);
  };
  const selectAudience = (index: number) => {
    setSelected(index);
    selectScene(0);
  };

  useEffect(() => {
    if (!inView || !visible || reduced) return;
    const timer = window.setInterval(
      () => setScene((current) => (current + 1) % 3),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [audience.id, inView, visible, reduced, scene, sceneRestart]);

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
          data-running={inView && visible && !reduced}
        >
          <div className="audience-preview-toolbar">
            <span>{t("Örnek senaryo")}</span>
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
                onClick={() => selectScene(index)}
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
