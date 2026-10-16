"use client";
import "./landing.css";

import Link from "next/link";
import {
  InstagramLogo,
  LinkedinLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
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
import { LandingAudience } from "./landing-audience";
import { LandingHero } from "./landing-hero";
import {
  LandingIntegrations,
  LandingWaitlistButton,
  LandingWaitlistProvider,
} from "./landing-integrations";

const stages = [
  {
    label: "Eğitimden önce",
    detailIcons: ["file", "mic"],
    title: "Kitleni tanı. Anlatımını dene.",
    text: "Kitleni tarif et. Katılımcılarını temsil eden yapay zekâ ajanlarıyla sesli pratik yap; anlatımını ve sorulara verdiğin yanıtları geliştir.",
    details: [
      "Kitlene göre oluşturulan yapay zekâ ajanları",
      "Anlatımına ve tempona yönelik geri bildirim",
    ],
    image: "/landing/rehearsal.webp",
    alt: "Bir sunumun etrafındaki farklı katılımcı profilleri ve sesli konuşma akışının izometrik görünümü",
  },
  {
    label: "Eğitim sırasında",
    detailIcons: ["activity", "chat"],
    title: "Etkileşimi aç. Katılımcılarını dahil et.",
    text: "Etkinliklerle yanıtları topla. Öğrenme ajanı katılımcıların sorularını eğitim kaynaklarına dayanarak yanıtlasın; sen de eğitimin akışına odaklan.",
    details: [
      "Anket, açık uçlu soru ve senaryolar",
      "Eğitim kaynaklarına dayanan öğrenme ajanı",
    ],
    image: "/landing/training.webp",
    alt: "Eğitmen sunumu, katılımcı telefonu ve aktivite yanıtlarının izometrik görünümü",
  },
  {
    label: "Eğitimden sonra",
    detailIcons: ["clock", "chart"],
    title: "Eğitim biter. Öğrenme devam eder.",
    text: "Katılımcılar öğrenme ajanına soru sormayı sürdürsün. Rapor ajanıyla yanıtları ve katılımı incele; sonraki eğitiminde neyi geliştirebileceğini gör.",
    details: [
      "Süresini senin belirlediğin öğrenme ajanı erişimi",
      "Eğitim verilerini yorumlayan rapor ajanı",
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
    "LİNBA’nın yapay zekâ ajanları ne yapar?",
    "Eğitimden önce katılımcılarını temsil eden ajanlarla sesli pratik yaparsın. Eğitim sırasında öğrenme ajanı katılımcıların sorularını eğitim kaynaklarına dayanarak yanıtlar. Sonrasında rapor ajanıyla soruları, aktivite yanıtlarını ve öğrenme ihtiyaçlarını birlikte incelersin.",
  ],
  [
    "Pratik ajanları kitleme nasıl uyum sağlar?",
    "Kitleni, deneyim düzeyini ve eğitim bağlamını tarif edersin. Bu tanıma göre oluşturulan yapay zekâ ajanları sesli pratiğine sorularla katılır. Geri bildirim, senin anlatımının netliği, tempon ve sorulara verdiğin yanıtlarla ilgilidir.",
  ],
  [
    "Öğrenme ajanı yanıtlarını neye dayandırır?",
    "Yüklediğin eğitim kaynaklarını kullanır ve ilgili slaytları gösterir. Kaynaklarda yanıt bulunmayan sorular eğitmene iletilir. Canlı eğitimde otomatik yanıtı açıp kapatabilirsin.",
  ],
  [
    "Rapor ajanı ölçme ve değerlendirmeye nasıl yardımcı olur?",
    "Katılımcı sorularını ve aktivite yanıtlarını incelemene yardımcı olur. Hangi konularda zorlanıldığını ve sonraki eğitimlerde neleri geliştirebileceğini sorabilirsin. Değerlendirme, eğitimde toplanan verilere dayanır; eğitimle ilgili kararları sen verirsin.",
  ],
  [
    "Eğitim bitince öğrenme ajanına erişim devam eder mi?",
    "Evet. Katılımcılar, eğitmenin belirlediği süre boyunca soru sormaya devam edebilir. Eğitim sonrası sorular da aynı eğitim raporuna eklenir.",
  ],
  [
    "Nasıl deneyebilirim, bekleme listesi ne için?",
    "Hesap oluşturarak LİNBA’yı deneyebilirsin. Bekleme listesine katılarak yeni özelliklerden ve gelişmelerden haberdar olabilirsin.",
    true,
  ],
] as const;

function LandingContent() {
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
            <a href="#kimler-icin">{t("Kullanım senaryoları")}</a>
            <a href="#entegrasyonlar">{t("Entegrasyonlar")}</a>
            <a href="#sorular">{t("Sık sorulanlar")}</a>
          </nav>
          <div className="landing-header-actions">
            <LandingLanguage />
            <div className="landing-auth-actions">
              <Link className="landing-login" href="/giris">
                {t("Giriş yap")}
              </Link>
              <Link
                className="button primary landing-signup"
                href="/giris?mod=kayit"
              >
                {t("Kayıt ol")}
              </Link>
            </div>
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
            onClick={(event) => {
              if ((event.target as Element).closest("a"))
                document.getElementById(mobileMenuId)?.hidePopover();
            }}
          >
            <a href="#nasil-calisir">{t("Nasıl çalışır?")}</a>
            <a href="#kimler-icin">{t("Kullanım senaryoları")}</a>
            <a href="#entegrasyonlar">{t("Entegrasyonlar")}</a>
            <a href="#sorular">{t("Sık sorulanlar")}</a>
          </nav>
        </header>
      </div>

      <main id="landing-main" tabIndex={-1}>
        <LandingHero />

        <section
          className="landing-flow landing-container"
          id="nasil-calisir"
          aria-labelledby="flow-title"
        >
          <div className="landing-flow-intro">
            <h2 id="flow-title">
              {t("Eğitimden önce, eğitim sırasında, eğitimden sonra.")}
            </h2>
            <p>
              {t(
                "Pratik yap, katılımcılarını dahil et, öğrenme ihtiyaçlarını gör.",
              )}
            </p>
          </div>
          <LandingFlow />
        </section>

        <LandingAudience />

        <LandingIntegrations />

        <section
          className="landing-questions landing-container"
          id="sorular"
          aria-labelledby="questions-title"
        >
          <div className="landing-faq-intro">
            <h2 id="questions-title">{t("Sık sorulan sorular.")}</h2>
            <p>
              {t(
                "Ajanların nasıl çalıştığını, neye dayandığını ve eğitimine nasıl eşlik ettiğini keşfet.",
              )}
            </p>
          </div>
          <div className="landing-faq-list">
            {questions.map(([question, answer, tryLink]) => (
              <details key={question} name="landing-faq">
                <summary>
                  {t(question)}
                  <Icon name="plus" size={26} />
                </summary>
                <p>
                  {tryLink && (
                    <>
                      <Link className="landing-faq-try" href="/giris?mod=kayit">
                        {t("Şimdi Dene, Ücretsiz!")}
                      </Link>{" "}
                    </>
                  )}
                  {t(answer)}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="landing-closing landing-container"
          aria-labelledby="closing-title"
        >
          <img
            className="landing-closing-art"
            src="/landing/agents-invitation.webp"
            width={480}
            height={360}
            loading="lazy"
            alt=""
            aria-hidden="true"
          />
          <div className="landing-closing-copy">
            <h2 id="closing-title">
              {t("Bir sonraki eğitimine ajanlarınla hazırlan.")}
            </h2>
            <p>
              {t(
                "Pratik yap, katılımcılarınla etkileşim kur, öğrenme ihtiyaçlarını keşfet.",
              )}
            </p>
            <div className="landing-cta-actions">
              <Link
                href="/giris?mod=kayit"
                className="button primary landing-try-button"
              >
                <span>{t("Şimdi Dene, Ücretsiz!")}</span>
                <Icon name="arrow" size={18} />
              </Link>
              <LandingWaitlistButton className="button landing-waitlist-button" />
            </div>
          </div>
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
          <p>{t("Eğitim için yapay zekâ ajanları.")}</p>
        </div>
        <nav className="landing-footer-links" aria-label={t("Alt gezinme")}>
          <a href="#nasil-calisir">{t("Nasıl çalışır?")}</a>
          <a href="#kimler-icin">{t("Kullanım senaryoları")}</a>
          <a href="#entegrasyonlar">{t("Entegrasyonlar")}</a>
          <a href="#sorular">{t("Sık sorulanlar")}</a>
          <LandingWaitlistButton />
          <Link href="/giris">{t("Giriş yap")}</Link>
        </nav>
        <div
          className="landing-footer-socials"
          role="group"
          aria-label={t("Sosyal medya")}
        >
          <div className="landing-footer-social-buttons">
            {[
              { name: "LinkedIn", Symbol: LinkedinLogo },
              { name: "Instagram", Symbol: InstagramLogo },
              { name: "X", Symbol: XLogo },
              { name: "YouTube", Symbol: YoutubeLogo },
            ].map(({ name, Symbol }) => (
              <button
                type="button"
                disabled
                key={name}
                aria-label={name}
                title={name}
              >
                <Symbol size={21} weight="regular" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} LİNBA</span>
        </div>
      </footer>
    </div>
  );
}

export function Landing() {
  return (
    <LandingWaitlistProvider>
      <LandingContent />
    </LandingWaitlistProvider>
  );
}
