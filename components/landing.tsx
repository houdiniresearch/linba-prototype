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
import { LandingFaq } from "./landing-faq";
import {
  LandingNavigationProvider,
  useLandingNavigation,
} from "./landing-navigation";
import {
  LandingIntegrations,
  LandingWaitlistButton,
  LandingWaitlistProvider,
} from "./landing-integrations";

const stages = [
  {
    label: "Before training",
    detailIcons: ["file", "mic"],
    title: "Meet your audience. Practice your delivery.",
    text: "Describe your audience. Practice out loud with AI agents representing your participants, and improve your delivery and responses to questions.",
    details: [
      "AI agents tailored to your audience",
      "Feedback on your delivery and pace",
    ],
    image: "/landing/rehearsal.webp",
    alt: "An isometric illustration of participant profiles and a voice conversation around a presentation",
  },
  {
    label: "During training",
    detailIcons: ["activity", "chat"],
    title: "Start the conversation. Engage your participants.",
    text: "Collect responses through activities. Let the learning agent answer participant questions using your training materials, while you focus on delivering the training.",
    details: [
      "Polls, open questions and scenarios",
      "A learning agent grounded in your training materials",
    ],
    image: "/landing/training.webp",
    alt: "An isometric illustration of a presenter’s slides, a participant’s phone and activity responses",
  },
  {
    label: "After training",
    detailIcons: ["clock", "chart"],
    title: "Training ends. Learning continues.",
    text: "Let participants keep asking their learning agent questions. Review responses and engagement with the report agent, and identify what to improve in your next training.",
    details: [
      "Learning agent access for a duration you choose",
      "A report agent that helps interpret training data",
    ],
    image: "/landing/follow-up.webp",
    alt: "An isometric illustration of a conversation and training report linked to presentation sources",
  },
] as const;

function LandingFlow() {
  const { t } = useLocale();
  const { isNavigating, subscribeToSettled } = useLandingNavigation();
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
      if (!inView || isNavigating()) return;
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
      if (inView && !frame && !isNavigating())
        frame = window.requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        schedule();
      },
      { rootMargin: "160px" },
    );
    observer.observe(container);
    const unsubscribe = subscribeToSettled(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      unsubscribe();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
      cards.forEach((card) => card.style.removeProperty("--stack-progress"));
    };
  }, [enhanced, isNavigating, subscribeToSettled]);

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
        aria-label={`${t("Language")}: ${locale === "tr" ? "Türkçe" : "English"}`}
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
        aria-label={t("Language")}
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

function LandingContent() {
  const { t } = useLocale();
  const { navigating, navigate } = useLandingNavigation();
  const mobileMenuId = useId();
  return (
    <div
      className="landing-page"
      data-navigating={navigating}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const anchor = (event.target as Element).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        const hash = anchor?.getAttribute("href");
        if (
          !hash ||
          ![
            "#how-it-works",
            "#use-cases",
            "#integrations",
            "#faq",
            "#landing-main",
          ].includes(hash)
        )
          return;
        event.preventDefault();
        navigate(hash);
      }}
    >
      <a className="landing-skip" href="#landing-main">
        {t("Skip to content")}
      </a>
      <aside
        className="landing-participant-strip"
        aria-label={t("Join training")}
      >
        <div className="landing-container">
          <form
            id="join-training"
            className="landing-join"
            action="/join"
            method="get"
            tabIndex={-1}
            aria-labelledby="landing-join-label"
          >
            <label id="landing-join-label" htmlFor="landing-join-code">
              {t("Are you a participant?")}
            </label>
            <div className="landing-join-fields">
              <input
                id="landing-join-code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                autoComplete="off"
                spellCheck={false}
                aria-label={t("Training code")}
                placeholder={t("6-digit code")}
                title={t("Enter the 6-digit code shared by your instructor.")}
              />
              <button type="submit" className="button landing-join-submit">
                {t("Join")}
              </button>
            </div>
          </form>
        </div>
      </aside>
      <div className="landing-header-shell">
        <header className="landing-header landing-container">
          <Link href="/" className="landing-brand" aria-label={t("LİNBA home")}>
            <Logo />
          </Link>
          <nav className="landing-nav" aria-label={t("Main navigation")}>
            <a href="#how-it-works">{t("How it works")}</a>
            <a href="#use-cases">{t("Use cases")}</a>
            <a href="#integrations">{t("Integrations")}</a>
            <a href="#faq">{t("FAQs")}</a>
          </nav>
          <div className="landing-header-actions">
            <LandingLanguage />
            <div className="landing-auth-actions">
              <Link className="landing-login" href="/login">
                {t("Log in")}
              </Link>
              <Link className="button primary landing-signup" href="/login">
                {t("Sign up")}
              </Link>
            </div>
            <button
              className="icon-button landing-menu-trigger"
              popoverTarget={mobileMenuId}
              aria-label={t("Open menu")}
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
            aria-label={t("Main navigation")}
            onClick={(event) => {
              if ((event.target as Element).closest("a"))
                document.getElementById(mobileMenuId)?.hidePopover();
            }}
          >
            <a href="#how-it-works">{t("How it works")}</a>
            <a href="#use-cases">{t("Use cases")}</a>
            <a href="#integrations">{t("Integrations")}</a>
            <a href="#faq">{t("FAQs")}</a>
          </nav>
        </header>
      </div>

      <main id="landing-main" tabIndex={-1}>
        <LandingHero />

        <section
          className="landing-flow landing-container"
          id="how-it-works"
          aria-labelledby="flow-title"
        >
          <div className="landing-flow-intro">
            <h2 id="flow-title">{t("Before, during and after training.")}</h2>
            <p>
              {t(
                "Practice, involve your participants and identify learning needs.",
              )}
            </p>
          </div>
          <LandingFlow />
        </section>

        <LandingAudience />

        <LandingIntegrations />

        <LandingFaq />

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
              {t("Prepare for your next training with your AI agents.")}
            </h2>
            <p>
              {t(
                "Practice, engage your participants and discover learning needs.",
              )}
            </p>
            <div className="landing-cta-actions">
              <Link
                href="/login?mode=signup"
                className="button primary landing-try-button"
              >
                <span>{t("Try Now, For Free!")}</span>
                <Icon name="arrow" size={18} />
              </Link>
              <LandingWaitlistButton className="button landing-waitlist-button" />
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <div className="landing-footer-brand">
          <Link href="/" className="landing-brand" aria-label={t("LİNBA home")}>
            <Logo />
          </Link>
          <p>{t("AI agents for education.")}</p>
        </div>
        <nav
          className="landing-footer-links"
          aria-label={t("Footer navigation")}
        >
          <a href="#how-it-works">{t("How it works")}</a>
          <a href="#use-cases">{t("Use cases")}</a>
          <a href="#integrations">{t("Integrations")}</a>
          <a href="#faq">{t("FAQs")}</a>
          <LandingWaitlistButton />
          <Link href="/login">{t("Log in")}</Link>
        </nav>
        <div
          className="landing-footer-socials"
          role="group"
          aria-label={t("Social media")}
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
    <LandingNavigationProvider>
      <LandingWaitlistProvider>
        <LandingContent />
      </LandingWaitlistProvider>
    </LandingNavigationProvider>
  );
}
