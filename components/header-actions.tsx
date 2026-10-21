"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Course, User } from "@/lib/types";
import type { WaitlistEntry } from "@/lib/waitlist";
import { useProductLocale as useLocale } from "./product-locale";
import { EmptyArtwork } from "./empty-artwork";
import { ThemeMenu } from "./theme-menu";
import { api, ErrorNote, Icon, Modal, useResource, dateTime } from "./ui";

export function HeaderActions({
  user,
  courses,
  onSettings,
  onReport,
  onLogout,
  waitlistRequest = 0,
  teamActions,
}: {
  user: User;
  courses: Course[];
  onSettings: (trigger?: HTMLElement) => void;
  onReport: (id: string) => void;
  onLogout: () => Promise<void>;
  waitlistRequest?: number;
  teamActions?: React.ReactNode;
}) {
  const { locale, setLocale, t } = useLocale();
  const profileId = useId(),
    languageId = useId(),
    notificationsId = useId();
  const profile = useRef<HTMLDivElement>(null),
    language = useRef<HTMLDivElement>(null),
    notifications = useRef<HTMLDivElement>(null);
  const profileTrigger = useRef<HTMLButtonElement>(null);
  const waitlist = useResource<{ entry: WaitlistEntry | null }>("waitlist");
  const [open, setOpen] = useState(false),
    [email, setEmail] = useState(user.email),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [accountError, setAccountError] = useState("");
  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase(locale);
  const reports = courses
    .filter((c) => c.status === "ended" && c.endedAt && !c.trashedAt)
    .sort((a, b) => b.endedAt!.localeCompare(a.endedAt!))
    .slice(0, 4);
  const notificationKey = `linba:notifications:seen:${user.id}`;
  const reportKeys = JSON.stringify(reports.map((c) => `${c.id}:${c.endedAt}`));
  const [seenNotifications, setSeenNotifications] = useState<{
    account: string;
    keys: string[];
  } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const hasUnread =
    seenNotifications?.account === user.id &&
    reports.some(
      (c) => !seenNotifications.keys.includes(`${c.id}:${c.endedAt}`),
    );

  useEffect(() => {
    function readSeen() {
      let keys: string[] = [];
      try {
        const stored: unknown = JSON.parse(
          localStorage.getItem(notificationKey) || "[]",
        );
        if (Array.isArray(stored))
          keys = stored.filter((key): key is string => typeof key === "string");
      } catch {
        // Reading notifications still works when browser storage is unavailable.
      }
      setSeenNotifications({ account: user.id, keys });
    }
    readSeen();
    const onStorage = (event: StorageEvent) => {
      if (event.key === notificationKey || event.key === null) readSeen();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [notificationKey, user.id]);

  useEffect(() => {
    if (!notificationsOpen || !hasUnread || !seenNotifications) return;
    const keys = [
      ...new Set([
        ...seenNotifications.keys,
        ...(JSON.parse(reportKeys) as string[]),
      ]),
    ].slice(-200);
    setSeenNotifications({ account: user.id, keys });
    try {
      localStorage.setItem(notificationKey, JSON.stringify(keys));
    } catch {
      // Keep the read state for this visit even if persistence is disabled.
    }
  }, [
    notificationsOpen,
    hasUnread,
    seenNotifications,
    reportKeys,
    notificationKey,
    user.id,
  ]);
  function upgrade() {
    profile.current?.hidePopover();
    setError("");
    setEditing(false);
    setEmail(waitlist.data?.entry?.email || user.email);
    setOpen(true);
  }
  useEffect(() => {
    if (waitlistRequest) upgrade();
  }, [waitlistRequest]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ entry: WaitlistEntry }>("waitlist", {
        email,
        locale,
      });
      waitlist.setData(result);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const registered = !!waitlist.data?.entry && !editing;
  return (
    <>
      <div className="header-actions">
        {teamActions}
        <button
          className="language-trigger"
          popoverTarget={languageId}
          aria-label={`${t("Language")}: ${locale === "tr" ? "Türkçe" : "English"}`}
        >
          <Icon name="globe" size={20} />
          <span>{locale.toUpperCase()}</span>
          <Icon name="downCaret" size={12} />
        </button>
        <button
          className="button early-access-trigger"
          onClick={upgrade}
          aria-label={t("Early access")}
        >
          <span>{t("Early access")}</span>
        </button>
        <ThemeMenu />
        <button
          className="header-round notification-trigger"
          popoverTarget={notificationsId}
          aria-label={t(
            hasUnread ? "Notifications, unread updates" : "Notifications",
          )}
        >
          <Icon name="bell" size={21} />
          {hasUnread && (
            <span className="notification-unread-dot" aria-hidden="true" />
          )}
        </button>
        <button
          ref={profileTrigger}
          className="profile-trigger"
          popoverTarget={profileId}
          aria-label={t("Profile menu")}
        >
          <span className="avatar">{initials}</span>
          <Icon name="downCaret" size={13} />
        </button>
      </div>
      <div
        ref={language}
        popover="auto"
        id={languageId}
        className="header-popover language-popover"
        aria-label={t("Language")}
      >
        <h2>{t("Language")}</h2>
        {(
          [
            ["tr", "Türkçe"],
            ["en", "English"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            className="popover-item language-choice"
            onClick={() => {
              setLocale(value);
              language.current?.hidePopover();
            }}
            aria-pressed={locale === value}
          >
            <span lang={value}>{label}</span>
            {locale === value && <Icon name="check" size={18} />}
          </button>
        ))}
      </div>
      <div
        ref={notifications}
        popover="auto"
        id={notificationsId}
        className="header-popover notifications-popover"
        aria-label={t("Notifications")}
        onToggle={(event) => setNotificationsOpen(event.newState === "open")}
      >
        <h2>{t("Notifications")}</h2>
        {reports.length ? (
          reports.map((c) => (
            <button
              key={c.id}
              className="report-notification"
              onClick={() => {
                notifications.current?.hidePopover();
                onReport(c.id);
              }}
            >
              <span className="notification-icon">
                <Icon name="chart" />
              </span>
              <span>
                <strong>{t("Your report is ready")}</strong>
                <span>{c.name}</span>
                <small>{dateTime(c.endedAt!, locale)}</small>
              </span>
              <Icon name="right" size={16} />
            </button>
          ))
        ) : (
          <div className="notification-empty">
            <EmptyArtwork kind="conversation" compact />
            <strong>{t("No notifications yet")}</strong>
            <p>{t("Updates about your training will appear here.")}</p>
          </div>
        )}
      </div>
      <div
        ref={profile}
        popover="auto"
        id={profileId}
        className="header-popover profile-popover"
        aria-label={t("Profile menu")}
      >
        <div className="profile-identity">
          <div>
            <strong>{user.name}</strong>
            <span className="plan-badge">{t("Early access")}</span>
          </div>
          {user.email && <p>{user.email}</p>}
        </div>
        <div className="profile-upgrade">
          <p>{t("Be among the first to try LİNBA’s new plans.")}</p>
          <button className="button upgrade" onClick={upgrade}>
            {t("Upgrade")}
            <Icon name="arrow" size={17} />
          </button>
        </div>
        <button
          className="popover-item"
          onClick={() => {
            profile.current?.hidePopover();
            onSettings(profileTrigger.current || undefined);
          }}
        >
          <Icon name="settings" />
          {t("Account settings")}
        </button>
        <button className="popover-item" onClick={upgrade}>
          <Icon name="star" />
          {t("Plan and upgrade")}
        </button>
        <hr />
        <ErrorNote message={accountError} />
        <button
          className="popover-item logout-item"
          onClick={async () => {
            profile.current?.hidePopover();
            setAccountError("");
            try {
              await onLogout();
            } catch (e) {
              setAccountError((e as Error).message);
              profile.current?.showPopover();
            }
          }}
        >
          <Icon name="logout" />
          {t("Log out")}
        </button>
      </div>
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        closeDisabled={busy}
        className="waitlist-modal"
        title={
          <span className="waitlist-heading">
            <span
              className={`waitlist-emblem ${registered ? "is-registered" : ""}`}
              aria-hidden="true"
            >
              <Icon name={registered ? "check" : "agent"} size={32} />
            </span>
            <span>
              {t(
                registered
                  ? "You’re on the waitlist"
                  : editing
                    ? "Let’s stay in touch."
                    : "Join the waitlist",
              )}
            </span>
          </span>
        }
        description={t(
          registered
            ? "We’ll keep you posted about LİNBA’s launch and integrations."
            : editing
              ? "Update the email address where you’d like to hear from us."
              : "Leave your email for LİNBA’s launch, new features and integrations.",
        )}
      >
        {registered ? (
          <div className="waitlist-confirmation" role="status">
            <div className="waitlist-email-record">
              <Icon name="send" size={21} />
              <div>
                <span>{t("Your registered email")}</span>
                <strong>{waitlist.data!.entry!.email}</strong>
              </div>
            </div>
            <div className="waitlist-confirmation-actions">
              <button
                className="text-button"
                onClick={() => {
                  setEmail(waitlist.data!.entry!.email);
                  setError("");
                  setEditing(true);
                }}
              >
                {t("Change email")}
              </button>
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
            <ErrorNote message={error || waitlist.error} />
            <button className="button primary full" disabled={busy}>
              {busy && <Icon name="spinner" className="spin" size={18} />}
              {busy
                ? t("Saving…")
                : t(editing ? "Save changes" : "Join the waitlist")}
              {!busy && <Icon name="arrow" size={19} />}
            </button>
            <p className="waitlist-footnote">
              {t("You can change your email address later.")}
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
