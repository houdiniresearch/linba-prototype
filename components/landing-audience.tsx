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
    benefit: "Eğitimine hazırlıklı git.",
    filename: "Ürün eğitimi.pdf",
    scenes: ["Kitleyi tanı", "Sesli prova", "Geri bildirim"],
    summary:
      "Örnek prova: eğitmen kitlesini tarif eder ve katılımcıları temsil eden yapay zekâ ajanlarıyla sesli prova yapar. Prova sonrasında anlatımının netliği, temposu ve sorulara verdiği yanıtlarla ilgili performans geri bildirimi alır.",
  },
  {
    id: "academic",
    label: "Öğretim görevlisi",
    title: "Yanıtları topla. Düşünme biçimlerini gör.",
    text: "Açık uçlu bir soruyla öğrencilerinden yazılı yanıtlar al. Yapay zekâ ajanı ortak fikirleri ve kavram yanılgılarını özetlesin; sen nerede yeniden açıklama gerektiğini gör.",
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
    text: "Atölyenden sonra da katılımcılarına bir öğrenme ajanı sun. Belirlediğin süre boyunca sorularını sorsunlar, eğitim kaynaklarına geri dönebilsinler.",
    benefit: "Bilgiyi ihtiyaç duydukları anda erişilebilir tut.",
    filename: "Hücre biyolojisi.pdf",
    scenes: ["Sorunu sor", "Yanıtı keşfet", "Kaynağa dön"],
    summary:
      "Örnek eğitim sonrası sohbet: katılımcı, hocanın gösterdiği bitki ve hayvan hücrelerini nasıl ayırt edeceğini sorar. Asistan sunumdaki farkları açıklar ve ilgili slaydı gösterir. Katılımcı, eğitmenin belirlediği 7 günlük asistan erişimi boyunca soru sormayı sürdürebilir.",
  },
  {
    id: "institution",
    label: "Eğitim kurumları",
    title: "Öğrenci davranışlarını anlayın. Eğitimlerinizi geliştirin.",
    text: "Öğrencilerimiz en çok hangi konularda zorlanıyor? Sonraki eğitimlerde neleri iyileştirebiliriz? Rapor ajanınızla katılımı, etkinlik yanıtlarını ve öğrenci davranışlarını birlikte değerlendirin.",
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
          <div className="audience-report-heading">
            <div className="audience-report-topline">
              <span>{t("Eğitim raporu")}</span>
              <span className="audience-report-status">
                <i />
                {t("Tamamlandı")}
              </span>
            </div>
            <h4>{t("Araştırma yöntemleri")}</h4>
            <p>{t("15 Ekim 2026 · Tamamlanan eğitim")}</p>
          </div>
          <div className="audience-report-visuals">
            <div className="audience-report-participation">
              <h5>{t("Öğrenci katılımı")}</h5>
              <svg
                viewBox="0 0 320 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="audience-report-grid"
                  d="M0 18H320M0 52H320M0 86H320M96 0V100M224 0V100"
                />
                <path
                  className="audience-report-area"
                  d="M0 77C16 77 22 63 40 66S62 42 80 45S102 24 120 30S142 52 160 43S182 57 200 46S220 22 240 26S262 11 280 19S304 16 320 14V100H0Z"
                />
                <path
                  className="audience-report-line"
                  d="M0 77C16 77 22 63 40 66S62 42 80 45S102 24 120 30S142 52 160 43S182 57 200 46S220 22 240 26S262 11 280 19S304 16 320 14"
                />
                <circle
                  cx="200"
                  cy="46"
                  r="5"
                  fill="var(--bg)"
                  stroke="var(--lilac-ink)"
                  strokeWidth="2"
                />
              </svg>
              <div className="audience-report-axis">
                <span>{t("Başlangıç")}</span>
                <span>{t("Etkinlik")}</span>
                <span>{t("Bitiş")}</span>
              </div>
            </div>
            <div className="audience-report-responses">
              <h5>{t("Etkinlik yanıtları")}</h5>
              <div className="audience-report-response-bars">
                {[
                  { label: "Net açıklama", width: "48%", tone: "clear" },
                  { label: "Kısmi açıklama", width: "34%", tone: "partial" },
                  { label: "Tekrar gerekli", width: "18%", tone: "review" },
                ].map((item) => (
                  <div key={item.tone} data-tone={item.tone}>
                    <span>{t(item.label)}</span>
                    <div>
                      <i style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="audience-report-focus">
            <span className="audience-report-focus-marker" />
            <div>
              <span>{t("Yeniden ele alınmalı")}</span>
              <strong>{t("Korelasyon ve nedensellik")}</strong>
              <p>
                {t("Benzer sorular ve eksik yanıtlar bu konuda yoğunlaşıyor.")}
              </p>
            </div>
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
            <Icon name="users" size={16} />
            {t("Kitle tanımın")}
          </span>
          <blockquote className="audience-audience-brief">
            {t(
              "Ürünü ilk kez anlatacak, müşteri deneyimi az olan yeni satış ekibi.",
            )}
          </blockquote>
          <span className="audience-message-label">
            <Icon name="sparkle" size={16} />
            {t("Yapay zekâ katılımcı ajanları")}
          </span>
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
        <div
          className="audience-demo-scene audience-rehearsal-scene"
          data-active={scene === 1}
        >
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
          <div className="audience-demo-message audience-agent-question">
            <span className="audience-message-label">
              {t("Ece · Yapay zekâ ajanı")}
            </span>
            <p>{t("Müşteri doğrudan fiyatı sorarsa nasıl ilerlemeliyim?")}</p>
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
              "Hocanın gösterdiği bitki ve hayvan hücrelerini nasıl ayırt ederiz?",
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
              "Bitki hücresinde hücre duvarı ve büyük merkezi koful bulunur; fotosentez yapan hücrelerinde kloroplast da vardır. Hayvan hücresinde hücre duvarı ve kloroplast yoktur. Her ikisinde de hücre zarı vardır.",
            )}
          </p>
          <div className="audience-source">
            <Icon name="file" size={17} />
            {t("Slayt 06 · Bitki ve hayvan hücresi")}
            <Icon name="arrow" size={14} />
          </div>
        </div>
      </div>
      <div className="audience-demo-scene" data-active={scene === 2}>
        <span className="audience-message-label">
          <Icon name="file" size={16} />
          {t("Kaynağa geri dön.")}
        </span>
        <div className="audience-biology-slide">
          <div className="audience-biology-slide-heading">
            <strong>{t("Bitki mi, hayvan mı?")}</strong>
            <span>06 / 12</span>
          </div>
          <div className="audience-cell-comparison">
            <div>
              <svg
                className="audience-cell-plant"
                viewBox="0 0 100 68"
                aria-hidden="true"
              >
                <rect
                  x="9"
                  y="5"
                  width="82"
                  height="58"
                  rx="13"
                  fill="currentColor"
                  fillOpacity=".08"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <rect
                  x="15"
                  y="11"
                  width="70"
                  height="46"
                  rx="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity=".4"
                />
                <rect
                  x="43"
                  y="19"
                  width="28"
                  height="29"
                  rx="9"
                  fill="currentColor"
                  fillOpacity=".13"
                />
                <circle cx="30" cy="34" r="9" fill="var(--brand-lilac)" />
                <circle cx="30" cy="34" r="3" fill="var(--lilac-ink)" />
                <ellipse cx="27" cy="17" rx="6" ry="3" fill="currentColor" />
                <ellipse cx="76" cy="48" rx="6" ry="3" fill="currentColor" />
                <ellipse cx="31" cy="51" rx="6" ry="3" fill="currentColor" />
              </svg>
              <strong>{t("Bitki hücresi")}</strong>
              <span>{t("Hücre duvarı var")}</span>
            </div>
            <div>
              <svg
                className="audience-cell-animal"
                viewBox="0 0 100 68"
                aria-hidden="true"
              >
                <ellipse
                  cx="50"
                  cy="34"
                  rx="37"
                  ry="28"
                  fill="currentColor"
                  fillOpacity=".08"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="44" cy="33" r="13" fill="var(--brand-lilac)" />
                <circle cx="44" cy="33" r="4" fill="var(--lilac-ink)" />
                <ellipse
                  cx="68"
                  cy="23"
                  rx="6"
                  ry="3"
                  fill="currentColor"
                  opacity=".4"
                  transform="rotate(-25 68 23)"
                />
                <ellipse
                  cx="64"
                  cy="48"
                  rx="6"
                  ry="3"
                  fill="currentColor"
                  opacity=".4"
                  transform="rotate(20 64 48)"
                />
                <circle
                  cx="26"
                  cy="43"
                  r="3"
                  fill="currentColor"
                  opacity=".3"
                />
              </svg>
              <strong>{t("Hayvan hücresi")}</strong>
              <span>{t("Hücre duvarı yok")}</span>
            </div>
          </div>
        </div>
        <div className="audience-access-note">
          <span className="audience-access-icon">
            <Icon name="clock" size={22} />
          </span>
          <div>
            <strong>
              {t("7 gün boyunca soru sormaya devam edebilirsin.")}
            </strong>
            <p>
              {t("Bu eğitim için asistan erişim süresini eğitmenin belirledi.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type Audience = (typeof audiences)[number];

function AudiencePanel({
  audience,
  active,
  enhanced,
  paused,
  onPause,
  reduced,
  visible,
}: {
  audience: Audience;
  active: boolean;
  enhanced: boolean;
  paused: boolean;
  onPause: () => void;
  reduced: boolean;
  visible: boolean;
}) {
  const { t } = useLocale();
  const panel = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [scene, setScene] = useState(0);
  const [sceneRestart, setSceneRestart] = useState(0);
  const running =
    inView && (!enhanced || active) && visible && !paused && !reduced;
  const selectScene = (index: number) => {
    setScene(index);
    setSceneRestart((current) => current + 1);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    if (panel.current) observer.observe(panel.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (active) {
      setScene(0);
      setSceneRestart((current) => current + 1);
    }
  }, [active]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setScene((current) => (current + 1) % 3),
      4500,
    );
    return () => window.clearTimeout(timer);
  }, [running, scene, sceneRestart]);

  return (
    <article
      className="audience-panel"
      id={`senaryo-${audience.id}`}
      aria-labelledby={`senaryo-${audience.id}-title`}
      data-active={active}
      aria-hidden={enhanced && !active ? true : undefined}
      inert={enhanced && !active}
      ref={panel}
    >
      <div className="audience-copy">
        <p className="audience-profile-label">{t(audience.label)}</p>
        <h3 id={`senaryo-${audience.id}-title`}>{t(audience.title)}</h3>
        <p>{t(audience.text)}</p>
        <div className="audience-benefit">
          <Icon name="check" size={19} />
          <span>{t(audience.benefit)}</span>
        </div>
      </div>
      <div className="audience-preview" data-running={running}>
        <div className="audience-preview-toolbar">
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
                <span className="audience-scene-number">
                  {scene === index && (
                    <svg
                      className="audience-scene-progress"
                      key={`${scene}-${sceneRestart}`}
                      viewBox="0 0 32 32"
                      aria-hidden="true"
                    >
                      <circle cx="16" cy="16" r="14" />
                    </svg>
                  )}
                  {index + 1}
                </span>
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
          {!reduced && (
            <button
              type="button"
              onClick={onPause}
              aria-label={t(
                paused ? "Animasyonu oynat" : "Animasyonu duraklat",
              )}
              aria-pressed={paused}
              title={t(paused ? "Animasyonu oynat" : "Animasyonu duraklat")}
            >
              <Icon name={paused ? "play" : "pause"} size={17} />
            </button>
          )}
        </div>
        <div className="audience-demo-window" aria-hidden="true">
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
        <p className="sr-only">{t(audience.summary)}</p>
      </div>
    </article>
  );
}

export function LandingAudience() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const section = useRef<HTMLElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.matchMedia(
      "(min-width: 1000px) and (min-height: 800px)",
    );
    const update = () => {
      setReduced(motion.matches);
      setEnhanced(viewport.matches && !motion.matches);
    };
    const visibility = () => setVisible(!document.hidden);
    update();
    visibility();
    motion.addEventListener("change", update);
    viewport.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      motion.removeEventListener("change", update);
      viewport.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    const container = section.current;
    const content = shell.current;
    if (!container || !content) return;
    let frame = 0;
    let inView = false;
    const measure = () => {
      if (enhanced)
        container.style.setProperty(
          "--audience-shell-height",
          `${content.offsetHeight}px`,
        );
    };
    const sizeObserver = new ResizeObserver(measure);
    if (enhanced) sizeObserver.observe(content);
    measure();
    const paint = () => {
      frame = 0;
      if (!inView) return;
      if (enhanced) {
        const top = container.getBoundingClientRect().top;
        const padding = parseFloat(getComputedStyle(container).paddingTop);
        const pin = parseFloat(getComputedStyle(content).top);
        const distance = Math.max(0, pin - top - padding);
        const next = Math.min(
          audiences.length - 1,
          Math.floor((distance + 1) / (window.innerHeight * 0.75)),
        );
        setSelected((current) => (current === next ? current : next));
      } else {
        const panels = Array.from(
          container.querySelectorAll<HTMLElement>(".audience-panel"),
        );
        const focusLine = window.innerHeight * 0.4;
        const next = panels.reduce(
          (best, panel, index) =>
            Math.abs(panel.getBoundingClientRect().top - focusLine) <
            Math.abs(panels[best].getBoundingClientRect().top - focusLine)
              ? index
              : best,
          0,
        );
        setSelected((current) => (current === next ? current : next));
      }
    };
    const schedule = () => {
      if (inView && !frame) frame = window.requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "100px" },
    );
    observer.observe(container);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      sizeObserver.disconnect();
      container.style.removeProperty("--audience-shell-height");
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [enhanced]);

  return (
    <section
      className="landing-audience landing-container"
      id="kimler-icin"
      aria-labelledby={`${id}-title`}
      data-scroll-enhanced={enhanced}
      ref={section}
    >
      <div className="audience-scroll-shell" ref={shell}>
        <div className="audience-heading">
          <h2 id={`${id}-title`}>{t("Senin eğitimine göre.")}</h2>
          <p>
            {t(
              "Farklı roller, farklı ihtiyaçlar. Prova, etkileşim ve değerlendirmede sana eşlik eden yapay zekâ ajanları.",
            )}
          </p>
        </div>
        <nav className="audience-tabs" aria-label={t("Eğitmen profilleri")}>
          {audiences.map((item, index) => (
            <a
              key={item.id}
              href={`#senaryo-${item.id}`}
              aria-current={selected === index ? "step" : undefined}
              onClick={(event) => {
                if (!enhanced || !section.current || !shell.current) return;
                event.preventDefault();
                const container = section.current;
                const padding = parseFloat(
                  getComputedStyle(container).paddingTop,
                );
                const pin = parseFloat(getComputedStyle(shell.current).top);
                window.scrollTo({
                  top:
                    window.scrollY +
                    container.getBoundingClientRect().top +
                    padding -
                    pin +
                    index * window.innerHeight * 0.75 +
                    2,
                  behavior: "smooth",
                });
              }}
            >
              <Icon
                name={
                  (["users", "presentation", "mic", "chart"] as const)[index]
                }
                size={20}
              />
              <span>{t(item.label)}</span>
            </a>
          ))}
        </nav>
        <div className="audience-panels">
          {audiences.map((audience, index) => (
            <AudiencePanel
              key={audience.id}
              audience={audience}
              active={selected === index}
              enhanced={enhanced}
              paused={paused}
              onPause={() => setPaused((current) => !current)}
              reduced={reduced}
              visible={visible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
