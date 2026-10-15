"use client";
import "./landing.css";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon, Logo } from "./ui";
import { useLocale } from "./locale-provider";
import { LandingIntegrations } from "./landing-integrations";

const stages = [
  {
    label: "Eğitimden önce",
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

function LandingFlow() {
  const { t } = useLocale();
  const stack = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(min-width: 1000px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setEnhanced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const container = stack.current;
    if (!enhanced || !container) return;
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>(".landing-stage-card"),
    );
    let frame = 0;
    let inView = false;
    const paint = () => {
      frame = 0;
      if (!inView) return;
      // Read the stack together before writing compositor-only visual changes.
      const positions = cards.map((card) => ({
        top: card.getBoundingClientRect().top,
        height: card.offsetHeight,
      }));
      cards.forEach((card, index) => {
        const current = positions[index];
        const next = positions[index + 1];
        const progress = next
          ? Math.max(
              0,
              Math.min(
                1,
                (current.top + current.height - next.top) / current.height,
              ),
            )
          : 0;
        card.style.setProperty("--stack-progress", progress.toFixed(4));
      });
    };
    const schedule = () => {
      if (inView && !frame) frame = window.requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "160px" },
    );
    observer.observe(container);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
      cards.forEach((card) => card.style.removeProperty("--stack-progress"));
    };
  }, [enhanced]);

  return (
    <div
      className="landing-flow-stack"
      ref={stack}
      data-stack-enhanced={enhanced}
    >
      {stages.map((item, index) => (
        <article
          key={item.label}
          className="landing-stage-card"
          data-stage={index}
          aria-labelledby={`stage-heading-${index}`}
        >
          <div className="landing-stage-copy">
            <p className="landing-stage-label">
              <Icon
                name={
                  index === 0 ? "mic" : index === 1 ? "presentation" : "chat"
                }
                size={28}
              />
              <span>{t(item.label)}</span>
            </p>
            <h3 id={`stage-heading-${index}`}>{t(item.title)}</h3>
            <p>{t(item.text)}</p>
            <ul>
              {item.details.map((detail, detailIndex) => (
                <li key={detail}>
                  <Icon name={item.detailIcons[detailIndex]} size={21} />
                  <span>{t(detail)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="landing-stage-art">
            <img
              src={item.image}
              alt={t(item.alt)}
              width={1448}
              height={1086}
              loading="lazy"
              decoding="async"
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function LandingLanguage() {
  const { locale, setLocale, t } = useLocale();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const position = useCallback(() => {
    if (!trigger.current || !panel.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = panel.current.getBoundingClientRect().width || 184;
    panel.current.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
    panel.current.style.top = `${rect.bottom + 8}px`;
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, position]);
  return (
    <>
      <button
        ref={trigger}
        className="landing-language"
        popoverTarget={id}
        onClick={position}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${t("Dil")}: ${locale === "tr" ? "Türkçe" : "English"}`}
      >
        <Icon name="globe" size={17} />
        <span>{locale.toUpperCase()}</span>
        <Icon name="downCaret" size={12} />
      </button>
      <div
        id={id}
        ref={panel}
        popover="auto"
        role="group"
        aria-label={t("Dil")}
        className="landing-language-menu"
        onToggle={(event) => {
          const expanded = event.newState === "open";
          setOpen(expanded);
          if (expanded)
            panel.current
              ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
              ?.focus();
        }}
        onKeyDown={(event) => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const buttons = Array.from(
            event.currentTarget.querySelectorAll("button"),
          );
          const current = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (current +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    buttons.length) %
                  buttons.length;
          buttons[next]?.focus();
        }}
      >
        {(
          [
            { value: "tr", label: "Türkçe" },
            { value: "en", label: "English" },
          ] as const
        ).map((choice) => (
          <button
            key={choice.value}
            type="button"
            aria-pressed={locale === choice.value}
            onClick={() => {
              setLocale(choice.value);
              panel.current?.hidePopover();
              trigger.current?.focus();
            }}
          >
            <span>{choice.label}</span>
            {locale === choice.value && <Icon name="check" size={17} />}
          </button>
        ))}
      </div>
    </>
  );
}

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
  const { t } = useLocale();
  const mobileMenuId = useId();
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#landing-main">
        {t("İçeriğe geç")}
      </a>
      <aside
        className="landing-participant-strip"
        aria-label={t("Eğitime katıl")}
      >
        <div className="landing-container">
          <form
            id="egitime-katil"
            className="landing-join"
            action="/katil"
            method="get"
            tabIndex={-1}
            aria-labelledby="landing-join-label"
          >
            <label id="landing-join-label" htmlFor="landing-join-code">
              {t("Katılımcı mısın?")}
            </label>
            <div className="landing-join-fields">
              <input
                id="landing-join-code"
                name="kod"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                autoComplete="off"
                spellCheck={false}
                aria-label={t("Eğitim kodu")}
                placeholder={t("6 haneli kod")}
                title={t("Eğitmeninin paylaştığı 6 haneli kodu gir.")}
              />
              <button type="submit" className="button landing-join-submit">
                {t("Katıl")}
              </button>
            </div>
          </form>
        </div>
      </aside>
      <div className="landing-header-shell">
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
            <a href="#egitime-katil">{t("Eğitime katıl")}</a>
          </nav>
          <div className="landing-header-actions">
            <LandingLanguage />
            <Link className="landing-login" href="/giris">
              {t("Giriş yap")}
            </Link>
            <Link
              className="button primary landing-signup"
              href="/giris?mod=kayit"
            >
              {t("Kayıt ol")}
            </Link>
            <button
              className="icon-button landing-menu-trigger"
              popoverTarget={mobileMenuId}
              aria-label={t("Menüyü aç")}
              onClick={(event) => {
                const menu = document.getElementById(mobileMenuId);
                if (menu)
                  menu.style.top = `${event.currentTarget.getBoundingClientRect().bottom + 12}px`;
              }}
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
            <a href="#egitime-katil">{t("Eğitime katıl")}</a>
          </nav>
        </header>
      </div>

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
                {t("Ücretsiz başla")}
                <Icon name="arrow" size={19} />
              </Link>
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
          <LandingFlow />
        </section>

        <LandingIntegrations />

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
            {t("Ücretsiz başla")}
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
