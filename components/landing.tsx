"use client";
import "./landing.css";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { Icon, Logo } from "./ui";
import { ThemeMenu } from "./theme-menu";
import { useLocale } from "./locale-provider";

const stages = [
  {
    label: "Eğitimden önce",
    hint: "Kitlene göre sesli prova",
    detailIcons: ["file", "mic"],
    title: "Kitleni tanı. Anlatımını dene.",
    text: "Sunumunu yükle, katılımcı kitleni tarif et. Farklı sorular soran yapay zekâ katılımcılarıyla sesli prova yap.",
    details: [
      "Sunumuna bağlı bir çalışma alanı",
      "Kitlene göre sesli prova ve geri bildirim",
    ],
    image: "/landing/rehearsal.webp",
    alt: "Bir sunumun etrafındaki farklı katılımcı profilleri ve sesli konuşma akışının izometrik görünümü",
  },
  {
    label: "Eğitim sırasında",
    hint: "Sunumla birlikte katılım",
    detailIcons: ["activity", "chat"],
    title: "Sunumun ilerlesin. Herkes katılsın.",
    text: "Aktivitelerini slaytlarının arasına yerleştir. İlgili slayta geldiğinde katılımcılar telefonlarından yanıtlasın, sorularını kişisel sohbetlerinde sorsun.",
    details: [
      "Sunum akışında anket, açık uçlu soru ve senaryo",
      "Kaynak slaytları gösteren asistan yanıtları",
    ],
    image: "/landing/training.webp",
    alt: "Eğitmen sunumu, katılımcı telefonu ve aktivite yanıtlarının izometrik görünümü",
  },
  {
    label: "Eğitimden sonra",
    hint: "Kaynaklı yanıtlar ve rapor",
    detailIcons: ["clock", "chart"],
    title: "Eğitim biter. Öğrenme devam eder.",
    text: "Katılımcıların, belirlediğin süre boyunca dokümana soru sormayı sürdürsün. Sen de soruları ve aktivite sonuçlarını raporundan incele.",
    details: [
      "Süresini senin belirlediğin asistan erişimi",
      "Her eğitime özel rapor ve rapor sohbeti",
    ],
    image: "/landing/follow-up.webp",
    alt: "Sunum kaynaklarıyla bağlantılı bir sohbet ve eğitim raporunun izometrik görünümü",
  },
] as const;

const questions = [
  [
    "Hangi sunumları yükleyebilirim?",
    "PDF ve PPTX dosyalarını yükleyebilirsin. LİNBA, sunumunun özgün içeriğini korur; aktivitelerini slaytların arasına ekleyebilirsin. Dosya sınırı 30 MB ve 80 slayttır.",
  ],
  [
    "Provada kimlerle konuşuyorum?",
    "Tarif ettiğin kitleye göre oluşturulan yapay zekâ katılımcılarıyla konuşursun. Eğitimini sesli anlatırken sorular ve yorumlarla katılırlar; prova sonunda geri bildirim alırsın.",
  ],
  [
    "Katılımcılar eğitime nasıl katılır?",
    "Katılımcılar hesaplarıyla, paylaştığın bağlantı veya eğitim kodunu kullanarak tarayıcıdan katılır. Sunumu, aktiviteleri ve kişisel sohbetlerini telefonlarından takip edebilirler.",
  ],
  [
    "Asistan her soruyu yanıtlar mı?",
    "Asistan yüklediğin dokümana dayanarak yanıt verir ve kaynak slaytları gösterir. Dokümanda yanıt bulunamayan sorular eğitmene iletilir. Canlı eğitimde otomatik yanıtı açıp kapatabilirsin.",
  ],
] as const;

export function Landing() {
  const { locale, setLocale, t } = useLocale();
  const mobileMenuId = useId();
  const [stage, setStage] = useState(0);
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#landing-main">
        {t("İçeriğe geç")}
      </a>
      <header className="landing-header landing-container">
        <Link
          href="/"
          className="landing-brand"
          aria-label={t("LİNBA ana sayfa")}
        >
          <Logo />
        </Link>
        <nav className="landing-nav" aria-label={t("Ana gezinme")}>
          <a href="#nasil-calisir">{t("Nasıl çalışır?")}</a>
          <a href="#sorular">{t("Sık sorulanlar")}</a>
          <Link href="/katil">{t("Eğitime katıl")}</Link>
        </nav>
        <div className="landing-header-actions">
          <ThemeMenu />
          <label className="landing-language">
            <Icon name="globe" size={17} />
            <select
              aria-label={t("Dil")}
              value={locale}
              onChange={(event) =>
                setLocale(event.target.value === "en" ? "en" : "tr")
              }
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </label>
          <Link className="landing-login" href="/giris">
            {t("Giriş yap")}
          </Link>
          <button
            className="icon-button landing-menu-trigger"
            popoverTarget={mobileMenuId}
            aria-label={t("Menüyü aç")}
          >
            <Icon name="menu" size={21} />
          </button>
        </div>
        <nav
          id={mobileMenuId}
          popover="auto"
          className="landing-mobile-nav"
          aria-label={t("Ana gezinme")}
          onClick={() => document.getElementById(mobileMenuId)?.hidePopover()}
        >
          <a href="#nasil-calisir">{t("Nasıl çalışır?")}</a>
          <a href="#sorular">{t("Sık sorulanlar")}</a>
          <Link href="/katil">{t("Eğitime katıl")}</Link>
        </nav>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section
          className="landing-hero landing-container"
          aria-labelledby="landing-title"
        >
          <div className="landing-hero-copy">
            <h1 id="landing-title">
              {t("Sunumunu yükle.")} <span>{t("Birlikte öğrenin.")}</span>
            </h1>
            <p>
              {t(
                "Kitlene göre prova yap. Eğitimde etkileşim kur. Sonrasında, sunumuna dayanan asistanınla öğrenmeyi sürdür.",
              )}
            </p>
            <div className="landing-hero-actions">
              <Link href="/giris?mod=kayit" className="button primary">
                {t("Hesap oluştur")}
                <Icon name="arrow" size={19} />
              </Link>
              <a href="#nasil-calisir" className="landing-text-link">
                {t("Nasıl çalışır?")}
                <Icon name="down" size={17} />
              </a>
            </div>
          </div>
          <div className="landing-hero-art">
            <Image
              src="/landing/hero-learning-space.webp"
              alt={t(
                "Katlanmış bir sunum sayfasının oluşturduğu öğrenme alanında eğitmen ve üç katılımcı",
              )}
              width={1448}
              height={1086}
              sizes="(max-width: 767px) 100vw, (max-width: 1100px) 55vw, 720px"
              loading="eager"
              fetchPriority="high"
              unoptimized
            />
          </div>
        </section>

        <section
          className="landing-flow landing-container"
          id="nasil-calisir"
          aria-labelledby="flow-title"
        >
          <div className="landing-flow-intro">
            <h2 id="flow-title">{t("Bir sunum. Baştan sona bir eğitim.")}</h2>
            <p>{t("Hazırlık, katılım ve takip aynı akışta buluşur.")}</p>
          </div>
          <div className="landing-flow-frame">
            <div
              className="landing-stage-tabs"
              role="tablist"
              aria-label={t("Eğitimin aşamaları")}
            >
              {stages.map((item, index) => (
                <button
                  key={item.label}
                  id={`stage-tab-${index}`}
                  role="tab"
                  aria-label={t(item.label)}
                  aria-describedby={`stage-hint-${index}`}
                  aria-selected={stage === index}
                  aria-controls={`stage-panel-${index}`}
                  tabIndex={stage === index ? 0 : -1}
                  onClick={() => setStage(index)}
                  onKeyDown={(event) => {
                    let next = stage;
                    if (event.key === "ArrowRight")
                      next = (stage + 1) % stages.length;
                    else if (event.key === "ArrowLeft")
                      next = (stage + stages.length - 1) % stages.length;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = stages.length - 1;
                    else return;
                    event.preventDefault();
                    setStage(next);
                    document.getElementById(`stage-tab-${next}`)?.focus();
                  }}
                >
                  <span className="landing-stage-tab-icon" aria-hidden="true">
                    <Icon
                      name={
                        index === 0
                          ? "mic"
                          : index === 1
                            ? "presentation"
                            : "chat"
                      }
                      size={23}
                    />
                  </span>
                  <span className="landing-stage-tab-text">
                    <strong>{t(item.label)}</strong>
                    <small id={`stage-hint-${index}`}>{t(item.hint)}</small>
                  </span>
                </button>
              ))}
            </div>
            {stages.map((active, index) => (
              <div
                key={active.label}
                className="landing-stage-panel"
                role="tabpanel"
                id={`stage-panel-${index}`}
                aria-labelledby={`stage-tab-${index}`}
                hidden={stage !== index}
                tabIndex={0}
              >
                <div className="landing-stage-art">
                  <img
                    key={active.image}
                    src={active.image}
                    alt={t(active.alt)}
                    width={1448}
                    height={1086}
                    sizes="(max-width: 767px) 100vw, 550px"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="landing-stage-copy">
                  <h3>{t(active.title)}</h3>
                  <p>{t(active.text)}</p>
                  <ul>
                    {active.details.map((detail, detailIndex) => (
                      <li key={detail}>
                        <Icon
                          name={active.detailIcons[detailIndex]}
                          size={21}
                        />
                        <span>{t(detail)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="landing-questions landing-container"
          id="sorular"
          aria-labelledby="questions-title"
        >
          <div className="landing-faq-intro">
            <h2 id="questions-title">{t("Başlamadan önce.")}</h2>
            <p>{t("Sunum, prova ve katılım hakkında merak ettiklerin.")}</p>
          </div>
          <div className="landing-faq-list">
            {questions.map(([question, answer], index) => (
              <details key={question} name="landing-faq" open={index === 0}>
                <summary>
                  {t(question)}
                  <Icon name="plus" size={20} />
                </summary>
                <p>{t(answer)}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="landing-closing landing-container"
          aria-labelledby="closing-title"
        >
          <div>
            <h2 id="closing-title">
              {t("Bir sonraki eğitimini birlikte hazırlayalım.")}
            </h2>
            <p>{t("İlk adım, elindeki sunum.")}</p>
          </div>
          <Link href="/giris?mod=kayit" className="button primary">
            {t("Hesap oluştur")}
            <Icon name="arrow" size={19} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <div className="landing-footer-brand">
          <Link
            href="/"
            className="landing-brand"
            aria-label={t("LİNBA ana sayfa")}
          >
            <Logo />
          </Link>
          <p>{t("Sunumdan birlikte öğrenmeye.")}</p>
        </div>
        <nav className="landing-footer-links" aria-label={t("Alt gezinme")}>
          <a href="#nasil-calisir">{t("Nasıl çalışır?")}</a>
          <Link href="/katil">{t("Eğitime katıl")}</Link>
          <Link href="/giris">{t("Giriş yap")}</Link>
        </nav>
        <span>© {new Date().getFullYear()} LİNBA</span>
      </footer>
    </div>
  );
}
