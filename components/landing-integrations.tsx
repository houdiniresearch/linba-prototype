"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { integrations, type IntegrationId } from "@/lib/integrations";
import { useLocale } from "./locale-provider";
import { api, ErrorNote, Icon, Logo, Modal } from "./ui";

function IntegrationLogo({
  id,
  size = 32,
}: {
  id: IntegrationId;
  size?: number;
}) {
  return id === "chatgpt" ? (
    <span className="integration-chatgpt-symbol" aria-hidden="true" />
  ) : (
    <img
      src={`/integrations/${id}.${id === "zoom" ? "png" : "svg"}`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
    />
  );
}

type Integration = (typeof integrations)[number];
const WaitlistContext = createContext<
  ((item: Integration | null, trigger: HTMLButtonElement) => void) | null
>(null);
function useWaitlist() {
  const open = useContext(WaitlistContext);
  if (!open) throw new Error("WaitlistProvider is required");
  return open;
}

export function LandingWaitlistProvider({ children }: { children: ReactNode }) {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState<
    (typeof integrations)[number] | null
  >(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const openWaitlist = useCallback(
    (item: Integration | null, element: HTMLButtonElement) => {
      trigger.current = element;
      setSelected(item);
      setOpen(true);
      setRegistered(false);
      setError("");
    },
    [],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!open || busy) return;
    setBusy(true);
    setError("");
    try {
      await api("public-waitlist", {
        email,
        locale,
      });
      setRegistered(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WaitlistContext.Provider value={openWaitlist}>
      {children}
      <Modal
        returnFocusRef={trigger}
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        closeDisabled={busy}
        className="waitlist-modal integration-waitlist-modal"
        title={
          <span className="waitlist-heading">
            <span className="integration-connection" aria-hidden="true">
              <Logo />
              {selected && (
                <>
                  <span className="integration-connection-link">
                    <Icon name={registered ? "check" : "link"} size={36} />
                  </span>
                  <span className="waitlist-emblem">
                    <IntegrationLogo id={selected.id} size={32} />
                  </span>
                </>
              )}
            </span>
            <span>
              {t(registered ? "You’re on the waitlist" : "Join the waitlist")}
            </span>
          </span>
        }
        description={t(
          registered
            ? "You’re on the LİNBA waitlist."
            : "Leave your email for LİNBA updates and launch news.",
        )}
      >
        {registered ? (
          <div className="waitlist-confirmation" role="status">
            <div className="waitlist-email-record">
              <Icon name="send" size={21} />
              <div>
                <span>{t("Your registered email")}</span>
                <strong>{email.trim().toLowerCase()}</strong>
              </div>
            </div>
            <div className="waitlist-confirmation-actions">
              <button className="button mint" onClick={() => setOpen(false)}>
                {t("Done")}
                <Icon name="check" size={18} />
              </button>
            </div>
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={submit}>
            <label>
              {t("Your email address")}
              <input
                type="email"
                autoFocus
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                disabled={busy}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("you@example.com")}
              />
            </label>
            <ErrorNote message={error} />
            <button className="button primary full" disabled={busy}>
              {busy && <Icon name="spinner" className="spin" size={18} />}
              {t(busy ? "Saving…" : "Join the waitlist")}
              {!busy && <Icon name="arrow" size={19} />}
            </button>
            <p className="waitlist-footnote">{t("Only for LİNBA updates.")}</p>
          </form>
        )}
      </Modal>
    </WaitlistContext.Provider>
  );
}

export function LandingIntegrations() {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = section.current;
    const map = element?.querySelector<HTMLElement>(".landing-integration-map");
    if (!element || !map) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hub = map.querySelector<HTMLElement>(".landing-integration-hub")!;
    const groups = ["presentations", "meetings", "assistants"].map((id) => ({
      id,
      target: map.querySelector<HTMLElement>(`.integration-group-${id}`)!,
    }));
    const targets = [hub, ...groups.map((group) => group.target)];
    let frame = 0;
    let nearby = false;
    const reset = () => {
      targets.forEach((target) =>
        target.style.removeProperty("--integration-reveal"),
      );
      groups.forEach((group) =>
        map.style.removeProperty(`--integration-${group.id}`),
      );
    };
    const paint = () => {
      frame = 0;
      if (media.matches) {
        reset();
        return;
      }
      // offsetTop/offsetHeight ignore the transform we paint, preventing feedback.
      const mapTop = map.getBoundingClientRect().top;
      const height = window.innerHeight;
      const progress = targets.map((target) => {
        const distance = Math.min(target.offsetHeight, height * 0.45) + 96;
        return Math.max(
          0,
          Math.min(1, (height - 64 - mapTop - target.offsetTop) / distance),
        );
      });
      targets.forEach((target, index) =>
        target.style.setProperty(
          "--integration-reveal",
          progress[index].toFixed(4),
        ),
      );
      groups.forEach((group, index) =>
        map.style.setProperty(
          `--integration-${group.id}`,
          progress[index + 1].toFixed(4),
        ),
      );
    };
    const schedule = () => {
      if (nearby && !frame && !media.matches)
        frame = window.requestAnimationFrame(paint);
    };
    const motion = () => {
      if (media.matches) reset();
      else schedule();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        nearby = entry.isIntersecting;
        if (nearby) schedule();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(map);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", motion);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", motion);
      window.cancelAnimationFrame(frame);
      reset();
    };
  }, []);
  const { t } = useLocale();
  const openWaitlist = useWaitlist();
  const groups = [
    {
      id: "presentations",
      title: "Presentation tools",
      icon: "presentation",
      tools: ["powerpoint", "google-slides"],
    },
    {
      id: "meetings",
      title: "Live training",
      icon: "monitor",
      tools: ["teams", "zoom", "google-meet"],
    },
    {
      id: "assistants",
      title: "AI assistants",
      icon: "chat",
      tools: ["chatgpt", "claude"],
    },
  ] as const;
  return (
    <section
      id="integrations"
      ref={section}
      className="landing-integrations landing-container"
      aria-labelledby="integrations-title"
    >
      <h2 id="integrations-title">
        {t("Bring training into the tools you use.")}
      </h2>
      <p>{t("Integrations with the tools you use are on the way.")}</p>
      <div className="landing-integration-map">
        <svg
          className="landing-integration-paths"
          viewBox="0 0 1080 480"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="integration-path-presentations"
            d="M450 130C360 130 360 130 280 130"
          />
          <path
            className="integration-path-meetings"
            d="M630 130C720 130 720 130 800 130"
          />
          <path className="integration-path-assistants" d="M540 220V286" />
          <path
            className="integration-progress-path integration-progress-presentations"
            pathLength={1}
            d="M450 130C360 130 360 130 280 130"
          />
          <path
            className="integration-progress-path integration-progress-meetings"
            pathLength={1}
            d="M630 130C720 130 720 130 800 130"
          />
          <path
            className="integration-progress-path integration-progress-assistants"
            pathLength={1}
            d="M540 220V286"
          />
          <circle cx="280" cy="130" r="4" />
          <circle cx="800" cy="130" r="4" />
          <circle cx="540" cy="286" r="4" />
        </svg>
        <div className="landing-integration-hub">
          <Logo />
        </div>
        {groups.map((group) => (
          <div
            className={`landing-integration-group integration-group-${group.id}`}
            key={group.id}
          >
            <h3>
              <Icon name={group.icon} size={17} />
              <span>{t(group.title)}</span>
            </h3>
            <div>
              {group.tools.map((id) => {
                const item = integrations.find((tool) => tool.id === id)!;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={t("{name} integration", {
                      name: item.name,
                    })}
                    onClick={(event) => {
                      openWaitlist(item, event.currentTarget);
                    }}
                  >
                    <IntegrationLogo id={item.id} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingWaitlistButton({
  className = "landing-waitlist-trigger",
}: {
  className?: string;
}) {
  const { t } = useLocale();
  const openWaitlist = useWaitlist();
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      onClick={(event) => {
        const mobileNav = event.currentTarget.closest<HTMLElement>(
          ".landing-mobile-nav",
        );
        mobileNav?.hidePopover();
        const returnTo = mobileNav
          ? document.querySelector<HTMLButtonElement>(".landing-menu-trigger")
          : event.currentTarget;
        if (returnTo) openWaitlist(null, returnTo);
      }}
    >
      {t("Join the waitlist")}
    </button>
  );
}
