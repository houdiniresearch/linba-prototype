"use client";
import { useId, useRef, useState } from "react";
import type { Course, User } from "@/lib/types";
import type { WaitlistEntry } from "@/lib/waitlist";
import { useLocale } from "./locale-provider";
import { api, date, ErrorNote, Icon, Modal, useResource } from "./ui";

export function HeaderActions({
  user,
  courses,
  onSettings,
  onReport,
  onLogout,
}: {
  user: User;
  courses: Course[];
  onSettings: () => void;
  onReport: (id: string) => void;
  onLogout: () => Promise<void>;
}) {
  const { locale, setLocale, t } = useLocale();
  const profileId = useId(),
    languageId = useId(),
    notificationsId = useId();
  const profile = useRef<HTMLDivElement>(null),
    language = useRef<HTMLDivElement>(null),
    notifications = useRef<HTMLDivElement>(null);
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
    .filter((c) => c.status === "ended" && c.endedAt)
    .sort((a, b) => b.endedAt!.localeCompare(a.endedAt!))
    .slice(0, 4);
  function upgrade() {
    profile.current?.hidePopover();
    setError("");
    setEditing(false);
    setEmail(waitlist.data?.entry?.email || user.email);
    setOpen(true);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  return (
    <>
      <div className="header-actions">
        <button
          className="language-trigger"
          popoverTarget={languageId}
          aria-label={`${t("Dil")}: ${locale === "tr" ? "Türkçe" : "English"}`}
        >
          <Icon name="globe" size={20} />
          <span>{locale.toUpperCase()}</span>
          <Icon name="downCaret" size={12} />
        </button>
        <button
          className="button primary upgrade-trigger"
          onClick={upgrade}
          aria-label="Upgrade"
        >
          <Icon name="star" size={18} />
          <span>Upgrade</span>
        </button>
        <button
          className="header-round"
          popoverTarget={notificationsId}
          aria-label={t("Bildirimler")}
        >
          <Icon name="bell" size={21} />
        </button>
        <button
          className="profile-trigger"
          popoverTarget={profileId}
          aria-label={t("Profil menüsü")}
        >
          <span className="avatar">{initials}</span>
        </button>
      </div>
      <div
        ref={language}
        popover="auto"
        id={languageId}
        className="header-popover language-popover"
        aria-label={t("Dil")}
      >
        <h2>{t("Dil")}</h2>
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
        aria-label={t("Bildirimler")}
      >
        <h2>{t("Bildirimler")}</h2>
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
                <strong>{t("Raporun hazır")}</strong>
                <span>{c.name}</span>
                <small>{date(c.endedAt!, locale)}</small>
              </span>
              <Icon name="right" size={16} />
            </button>
          ))
        ) : (
          <div className="notification-empty">
            <Icon name="bell" size={28} />
            <strong>{t("Henüz bildirim yok")}</strong>
            <p>{t("Eğitimlerinle ilgili gelişmeler burada görünür.")}</p>
          </div>
        )}
      </div>
      <div
        ref={profile}
        popover="auto"
        id={profileId}
        className="header-popover profile-popover"
        aria-label={t("Profil menüsü")}
      >
        <div className="profile-identity">
          <div>
            <strong>{user.name}</strong>
            <span className="plan-badge">{t("Ücretsiz")}</span>
          </div>
          <p>{user.email || t("Deneme hesabı")}</p>
        </div>
        <div className="profile-upgrade">
          <p>{t("LİNBA’nın yeni planlarını ilk deneyenlerden ol.")}</p>
          <button className="button primary" onClick={upgrade}>
            Upgrade
            <Icon name="arrow" size={17} />
          </button>
        </div>
        <button
          className="popover-item"
          onClick={() => {
            profile.current?.hidePopover();
            onSettings();
          }}
        >
          <Icon name="settings" />
          {t("Hesap ayarları")}
        </button>
        <button className="popover-item" onClick={upgrade}>
          <Icon name="star" />
          {t("Plan ve yükseltme")}
        </button>
        <hr />
        <ErrorNote message={accountError} />
        <button
          className="popover-item logout-item"
          onClick={async () => {
            profile.current?.hidePopover();
            try {
              await onLogout();
            } catch (e) {
              setAccountError((e as Error).message);
              profile.current?.showPopover();
            }
          }}
        >
          <Icon name="logout" />
          {t("Çıkış yap")}
        </button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t(
          waitlist.data?.entry && !editing
            ? "Bekleme listesindesin"
            : "Bekleme listesi",
        )}
        description={t(
          waitlist.data?.entry && !editing
            ? "E-posta adresin kaydedildi."
            : "Yeni planlar hazır olduğunda haberdar olmak için e-postanı bırak.",
        )}
      >
        {waitlist.data?.entry && !editing ? (
          <div className="waitlist-success" role="status">
            <span className="waitlist-success-icon">
              <Icon name="check" size={26} />
            </span>
            <strong>{waitlist.data.entry.email}</strong>
            <button
              className="text-button"
              onClick={() => {
                setEmail(waitlist.data!.entry!.email);
                setEditing(true);
              }}
            >
              {t("E-postayı değiştir")}
            </button>
            <button
              className="button primary full"
              onClick={() => setOpen(false)}
            >
              {t("Kapat")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              {t("E-posta")}
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("sen@ornek.com")}
              />
            </label>
            <ErrorNote message={error || waitlist.error} />
            <button className="button primary full" disabled={busy}>
              {busy
                ? t("Kaydediliyor…")
                : t(
                    editing
                      ? "Değişiklikleri kaydet"
                      : "Bekleme listesine katıl",
                  )}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
