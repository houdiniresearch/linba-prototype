"use client";
import { ProductSelect } from "./product-select";
import { useEffect, useRef, useState } from "react";
import {
  InstagramLogo,
  LinkedinLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { AgentMark } from "./agent-identity";
import { useProductLocale as useLocale } from "./product-locale";
import { api, ErrorNote, Icon, Modal } from "./ui";

const updates = [
  {
    id: "practice",
    category: "Practice agent",
    title: "Meet your audience before you teach.",
    description:
      "Describe your participants, practice out loud and get feedback on your delivery with AI agents tailored to your audience.",
    image: "/agents/practice-editorial.webp",
    detail: "A practice room built around your audience",
  },
  {
    id: "activities",
    category: "Activities",
    title: "Make room for every participant’s voice.",
    description:
      "Add polls, open questions and scenarios. Preview the participant experience and place activities anywhere in your training flow.",
    image: "/agents/learning-editorial.webp",
    detail: "From a question to a shared conversation",
  },
  {
    id: "reports",
    category: "Report agent",
    title: "Keep the conversation close to the evidence.",
    description:
      "Ask about your completed training and explore the source records in a report panel, right beside your conversation.",
    image: "/agents/report-editorial.webp",
    detail: "Your conversation and report, side by side",
  },
] as const;
export type HomeFeature = (typeof updates)[number]["id"];

export function HomeUpdates({
  onExplore,
  draftCount,
  ready,
  paused = false,
}: {
  onExplore: (feature: HomeFeature, trigger: HTMLElement) => void;
  draftCount: number;
  ready: boolean;
  paused?: boolean;
}) {
  const { t, locale } = useLocale();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [canRotate, setCanRotate] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("idea");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef("");
  const feedbackTrigger = useRef<HTMLButtonElement>(null);
  const allTrigger = useRef<HTMLButtonElement>(null);
  const update = updates[active];
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCanRotate(!document.hidden && !reduced.matches);
    update();
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (!canRotate || hovered || focused || allOpen || feedbackOpen || paused)
      return;
    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % updates.length),
      6000,
    );
    return () => window.clearTimeout(timer);
  }, [active, canRotate, hovered, focused, allOpen, feedbackOpen, paused]);
  function actionLabel(feature: HomeFeature) {
    return feature === "reports"
      ? t("View reports")
      : draftCount > 1
        ? t("Choose training")
        : draftCount === 1
          ? t(
              feature === "practice"
                ? "Open practice room"
                : "Open your workspace",
            )
          : t("Create training");
  }
  async function sendFeedback() {
    if (busy || !message.trim()) return;
    setBusy(true);
    setError("");
    requestId.current ||= crypto.randomUUID();
    try {
      await api("feedback", {
        message,
        category,
        locale,
        requestId: requestId.current,
      });
      setSent(true);
      setMessage("");
      requestId.current = "";
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="home-updates" aria-label={t("Discover LİNBA")}>
      <section
        className="home-news"
        aria-labelledby="home-news-heading"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
      >
        <div className="home-panel-heading">
          <h2 id="home-news-heading">{t("What’s new")}</h2>
          <button
            ref={allTrigger}
            className="text-button"
            onClick={() => setAllOpen(true)}
          >
            {t("View all")}
            <Icon name="right" size={15} />
          </button>
        </div>
        <article key={update.id}>
          <div className={`home-news-art home-news-art-${update.id}`}>
            <div className="home-news-brand">
              <AgentMark size={22} />
              <span>{t(update.category)}</span>
            </div>
            <strong>{t(update.detail)}</strong>
            <img src={update.image} alt="" width="800" height="600" />
          </div>
          <div className="home-news-copy">
            <h3>{t(update.title)}</h3>
            <p>{t(update.description)}</p>
            <button
              className="text-button home-news-action"
              disabled={!ready}
              onClick={(event) => onExplore(update.id, event.currentTarget)}
            >
              {actionLabel(update.id)}
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </article>
        <div className="home-news-controls">
          <div
            className="home-news-dots"
            role="group"
            aria-label={t("Choose an update")}
          >
            {updates.map((item, index) => (
              <button
                key={item.id}
                aria-label={t(item.category)}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="home-feedback">
        <div className="home-feedback-mark" aria-hidden="true">
          <AgentMark size={32} />
        </div>
        <div>
          <h2>{t("Make LİNBA better, together.")}</h2>
          <p>
            {t("An idea, a rough edge, something you need? We’re listening.")}
          </p>
        </div>
        <button
          ref={feedbackTrigger}
          className="text-button"
          onClick={() => {
            setSent(false);
            setError("");
            setFeedbackOpen(true);
          }}
        >
          {t("Share feedback")}
          <Icon name="arrow" size={17} />
        </button>
      </section>
      <section className="home-socials" aria-labelledby="home-socials-heading">
        <h2 id="home-socials-heading">{t("Stay connected")}</h2>
        <div role="group" aria-label={t("Social media")}>
          {[
            { name: "LinkedIn", Symbol: LinkedinLogo, brand: "linkedin" },
            { name: "Instagram", Symbol: InstagramLogo, brand: "instagram" },
            { name: "YouTube", Symbol: YoutubeLogo, brand: "youtube" },
            { name: "X", Symbol: XLogo, brand: "x" },
          ].map(({ name, Symbol, brand }) => (
            <button
              className={`social-${brand}`}
              key={name}
              type="button"
              disabled
              aria-label={name}
            >
              <Symbol
                size={18}
                weight={
                  brand === "instagram" || brand === "x" ? "regular" : "fill"
                }
                aria-hidden="true"
              />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </section>
      <Modal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        title={t("What’s new in LİNBA")}
        returnFocusRef={allTrigger}
        className="home-updates-modal"
      >
        <div className="home-update-list">
          {updates.map((item) => (
            <article key={item.id}>
              <img
                src={item.image}
                alt=""
                width="800"
                height="600"
                loading="lazy"
              />
              <div>
                <span>{t(item.category)}</span>
                <h3>{t(item.title)}</h3>
                <p>{t(item.description)}</p>
                <button
                  className="text-button"
                  disabled={!ready}
                  onClick={(event) => {
                    setAllOpen(false);
                    onExplore(
                      item.id,
                      allTrigger.current || event.currentTarget,
                    );
                  }}
                >
                  {actionLabel(item.id)}
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </Modal>
      <Modal
        open={feedbackOpen}
        onClose={() => !busy && setFeedbackOpen(false)}
        closeDisabled={busy}
        title={t(
          sent
            ? "Thanks for helping shape LİNBA."
            : "What would make LİNBA better for you?",
        )}
        returnFocusRef={feedbackTrigger}
      >
        {sent ? (
          <div className="home-feedback-success" role="status">
            <Icon name="check" size={24} />
            <p>
              {t(
                "Your feedback has been saved. Thank you for sharing it with us.",
              )}
            </p>
            <button className="button" onClick={() => setFeedbackOpen(false)}>
              {t("Done")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendFeedback();
            }}
          >
            <label>
              {t("Feedback type")}
              <ProductSelect
                label={t("Feedback type")}
                value={category}
                disabled={busy}
                onChange={(value) => {
                  setCategory(value);
                  requestId.current = "";
                }}
                options={[
                  { value: "idea", label: t("An idea") },
                  { value: "issue", label: t("Something isn’t working") },
                  { value: "other", label: t("Something else") },
                ]}
              />
            </label>
            <label>
              {t("Your feedback")}
              <textarea
                rows={5}
                maxLength={2000}
                required
                disabled={busy}
                value={message}
                placeholder={t("Tell us what you had in mind…")}
                onChange={(event) => {
                  setMessage(event.target.value);
                  requestId.current = "";
                }}
              />
            </label>
            <p className="small muted">
              {t("Your feedback is saved with your account.")}
            </p>
            <ErrorNote message={error} />
            <div className="modal-actions">
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => setFeedbackOpen(false)}
              >
                {t("Cancel")}
              </button>
              <button
                className="button primary"
                disabled={busy || !message.trim()}
              >
                {t(busy ? "Saving…" : "Send feedback")}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </aside>
  );
}
