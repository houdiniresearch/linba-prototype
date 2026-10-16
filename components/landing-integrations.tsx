"use client";

import {
  createContext,
  useCallback,
  useContext,
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
              {t(
                registered
                  ? "Bekleme listesindesin"
                  : "Bekleme listesine katıl",
              )}
            </span>
          </span>
        }
        description={t(
          registered
            ? "LİNBA bekleme listesine kaydın alındı."
            : "LİNBA’daki yeniliklerden ve kullanıma açılıştan haberdar olmak için e-postanı bırak.",
        )}
      >
        {registered ? (
          <div className="waitlist-confirmation" role="status">
            <div className="waitlist-email-record">
              <Icon name="send" size={21} />
              <div>
                <span>{t("Kayıtlı e-posta adresin")}</span>
                <strong>{email.trim().toLowerCase()}</strong>
              </div>
            </div>
            <div className="waitlist-confirmation-actions">
              <button className="button mint" onClick={() => setOpen(false)}>
                {t("Tamam")}
                <Icon name="check" size={18} />
              </button>
            </div>
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={submit}>
            <label>
              {t("E-posta adresin")}
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
                placeholder={t("sen@ornek.com")}
              />
            </label>
            <ErrorNote message={error} />
            <button className="button primary full" disabled={busy}>
              {busy && <Icon name="spinner" className="spin" size={18} />}
              {t(busy ? "Kaydediliyor…" : "Bekleme listesine katıl")}
              {!busy && <Icon name="arrow" size={19} />}
            </button>
            <p className="waitlist-footnote">
              {t("Yalnızca LİNBA ile ilgili haberler için.")}
            </p>
          </form>
        )}
      </Modal>
    </WaitlistContext.Provider>
  );
}

export function LandingIntegrations() {
  const { t } = useLocale();
  const openWaitlist = useWaitlist();
  const groups = [
    {
      id: "presentations",
      title: "Sunum araçları",
      tools: ["powerpoint", "google-slides"],
    },
    {
      id: "meetings",
      title: "Canlı eğitim",
      tools: ["teams", "zoom", "google-meet"],
    },
    { id: "assistants", title: "Yapay zekâ asistanları", tools: ["chatgpt"] },
  ] as const;
  return (
    <section
      id="entegrasyonlar"
      className="landing-integrations landing-container"
      aria-labelledby="integrations-title"
    >
      <h2 id="integrations-title">
        {t("Eğitimin, çalıştığın araçlarla buluşsun.")}
      </h2>
      <p>{t("Kullandığın araçlar için entegrasyonlar yolda.")}</p>
      <div className="landing-integration-map">
        <svg
          className="landing-integration-paths"
          viewBox="0 0 1080 410"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="integration-path-presentations"
            d="M280 130C360 130 360 130 450 130"
          />
          <path
            className="integration-path-meetings"
            d="M630 130C720 130 720 130 800 130"
          />
          <path className="integration-path-assistants" d="M540 220V306" />
          <circle cx="280" cy="130" r="4" />
          <circle cx="800" cy="130" r="4" />
          <circle cx="540" cy="306" r="4" />
        </svg>
        <div className="landing-integration-hub">
          <Logo />
        </div>
        {groups.map((group) => (
          <div
            className={`landing-integration-group integration-group-${group.id}`}
            key={group.id}
          >
            <h3>{t(group.title)}</h3>
            <div>
              {group.tools.map((id) => {
                const item = integrations.find((tool) => tool.id === id)!;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={t("{name} entegrasyonu", {
                      name: item.name,
                    })}
                    onClick={(event) => {
                      openWaitlist(item, event.currentTarget);
                    }}
                  >
                    <IntegrationLogo id={item.id} />
                    <span>{item.name}</span>
                    <Icon name="arrow" size={17} />
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

export function LandingWaitlistButton() {
  const { t } = useLocale();
  const openWaitlist = useWaitlist();
  return (
    <button
      type="button"
      className="landing-waitlist-trigger"
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
      {t("Bekleme listesine katıl")}
    </button>
  );
}
