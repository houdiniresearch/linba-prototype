"use client";
import { ProductSelect } from "./product-select";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { User } from "@/lib/types";
import { useProductLocale as useLocale } from "./product-locale";
import { useTheme, type Theme } from "./theme-provider";
import { EmptyArtwork } from "./empty-artwork";
import {
  api,
  ErrorNote,
  Icon,
  Modal,
  ResourceFailure,
  useResource,
} from "./ui";

const sections = [
  {
    id: "profile",
    title: "My profile",
    icon: "user",
    description: "Your name and account details.",
  },
  {
    id: "security",
    title: "Security",
    icon: "shield",
    description: "Keep access to your account secure.",
  },
  {
    id: "billing",
    title: "Billing & payments",
    icon: "creditCard",
    description: "Your plan and billing history, in one place.",
  },
  {
    id: "preferences",
    title: "General preferences",
    icon: "preferences",
    description: "Make your workspace feel right for you.",
  },
] as const;
type Section = (typeof sections)[number]["id"];

export function AccountSettings({
  open,
  user,
  onClose,
  onSaved,
  onWaitlist,
  returnFocusRef,
}: {
  open: boolean;
  user: User;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onWaitlist: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const account = useResource<{ hasPassword: boolean; plan: string }>(
    "account",
    0,
    open,
  );
  const [tab, setTab] = useState<Section>("profile"),
    [name, setName] = useState(user.name),
    [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [discard, setDiscard] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const id = useId(),
    tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const dirty =
    name.trim() !== user.name || (!user.demo && email.trim() !== user.email);
  const passwordsDirty = !!(currentPassword || newPassword || confirm);
  const section = sections.find((item) => item.id === tab)!;
  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
      setError("");
      setSaved(false);
      setDiscard(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
  }, [open, user.name, user.email]);
  function requestClose() {
    if (busy) return;
    if (dirty || passwordsDirty) setDiscard(true);
    else onClose();
  }
  useEffect(() => {
    if (open && compact)
      tabs.current[
        sections.findIndex((item) => item.id === tab)
      ]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab, compact, open, locale]);
  async function save(action: "profile" | "security") {
    if (busy) return;
    setError("");
    setSaved(false);
    if (action === "security" && newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api(
        "account",
        action === "profile"
          ? { name, email }
          : { currentPassword, newPassword },
        action === "profile" ? "PATCH" : "POST",
      );
      if (action === "profile") await onSaved();
      else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
      }
      setSaved(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function selectTab(next: Section) {
    setTab(next);
    setError("");
    setSaved(false);
  }
  return (
    <Modal
      open={open}
      onClose={requestClose}
      closeDisabled={busy}
      title={t("Settings")}
      className="account-settings-modal"
      returnFocusRef={returnFocusRef}
    >
      <div className="account-settings-layout">
        <nav
          className="settings-navigation"
          role="tablist"
          aria-orientation={compact ? "horizontal" : "vertical"}
          aria-label={t("Settings sections")}
        >
          {sections.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-${item.id}`}
              aria-controls={`${id}-panel`}
              aria-selected={tab === item.id}
              tabIndex={tab === item.id ? 0 : -1}
              disabled={busy}
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => {
                let next = index;
                if (["ArrowDown", "ArrowRight"].includes(event.key))
                  next = (index + 1) % sections.length;
                else if (["ArrowUp", "ArrowLeft"].includes(event.key))
                  next = (index - 1 + sections.length) % sections.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = sections.length - 1;
                else return;
                event.preventDefault();
                selectTab(sections[next].id);
                tabs.current[next]?.focus();
              }}
            >
              <Icon name={item.icon} size={19} />
              <span>{t(item.title)}</span>
            </button>
          ))}
        </nav>
        <section
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${tab}`}
          className="account-settings-content"
          tabIndex={0}
        >
          <header className="settings-section-heading">
            <h3>{t(section.title)}</h3>
            <p>{t(section.description)}</p>
          </header>
          {tab === "profile" && (
            <form
              id={`${id}-profile`}
              className="settings-form"
              onSubmit={(event) => {
                event.preventDefault();
                void save("profile");
              }}
            >
              <div className="settings-profile-avatar">
                <span className="avatar">
                  {name.trim().slice(0, 1).toLocaleUpperCase(locale)}
                </span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{t(user.demo ? "Early access" : "Instructor")}</span>
                </div>
              </div>
              <label>
                {t("Full name")}
                <input
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  disabled={busy}
                  required
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              {user.demo ? (
                <div className="settings-account-note">
                  <Icon name="shield" size={19} />
                  <p>{t("Access lasts up to 7 days in this browser.")}</p>
                </div>
              ) : (
                <label>
                  {t("Email")}
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    disabled={busy}
                    required
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setSaved(false);
                    }}
                  />
                </label>
              )}
            </form>
          )}
          {tab === "security" &&
            (!account.data ? (
              account.error ? (
                <ResourceFailure
                  error={account.error}
                  onRetry={account.refresh}
                />
              ) : (
                <div className="settings-loading" role="status">
                  {t("Loading…")}
                </div>
              )
            ) : account.data.hasPassword ? (
              <form
                id={`${id}-security`}
                className="settings-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void save("security");
                }}
              >
                <p className="settings-account-note">
                  {t(
                    "Change your password. Other sessions will be signed out.",
                  )}
                </p>
                <label>
                  {t("Current password")}
                  <input
                    type="password"
                    autoComplete="current-password"
                    maxLength={128}
                    value={currentPassword}
                    disabled={busy}
                    required
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label>
                  {t("New password")}
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={newPassword}
                    disabled={busy}
                    required
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                  <small>{t("At least 8 characters")}</small>
                </label>
                <label>
                  {t("Confirm new password")}
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={confirm}
                    disabled={busy}
                    required
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </label>
              </form>
            ) : (
              <div className="settings-empty-state">
                <Icon name="shield" size={30} />
                <h4>{t("Your early access account is ready")}</h4>
                <p>
                  {t(
                    "No password is needed to explore. Password settings become available with a registered account.",
                  )}
                </p>
              </div>
            ))}
          {tab === "billing" && (
            <div className="settings-billing">
              <div className="settings-plan">
                <div>
                  <span>{t("Current plan")}</span>
                  <strong>{t("Early access")}</strong>
                  <p>{t("Your account has no active paid subscription.")}</p>
                </div>
                <span className="settings-plan-badge">{t("Current plan")}</span>
              </div>
              <div className="settings-invoices">
                <h4>{t("Invoices")}</h4>
                <EmptyArtwork kind="reports" compact />
                <p>{t("No invoices yet.")}</p>
                <span>
                  {t(
                    "Your invoices will appear here when billing is available.",
                  )}
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  onClose();
                  onWaitlist();
                }}
              >
                {t("Get launch updates")}
                <Icon name="arrow" size={17} />
              </button>
            </div>
          )}
          {tab === "preferences" && (
            <div className="settings-preferences">
              <div className="settings-preference-row">
                <div>
                  <label htmlFor={`${id}-language`}>{t("Language")}</label>
                  <p>{t("The language used across your workspace.")}</p>
                </div>
                <ProductSelect
                  id={`${id}-language`}
                  label={t("Language")}
                  value={locale}
                  onChange={(value) => setLocale(value as "tr" | "en")}
                  options={[
                    { value: "tr", label: "Türkçe" },
                    { value: "en", label: "English" },
                  ]}
                />
              </div>
              <fieldset className="settings-appearance">
                <legend>{t("Appearance")}</legend>
                <p>{t("Choose a theme, or follow your device.")}</p>
                <div className="theme-options">
                  {(["light", "dark", "system"] as const).map((option) => (
                    <label
                      key={option}
                      className={`theme-option theme-option-${option}`}
                    >
                      <input
                        type="radio"
                        name={`${id}-theme`}
                        value={option}
                        checked={theme === option}
                        onChange={() => setTheme(option as Theme)}
                      />
                      <span className="theme-preview" aria-hidden="true">
                        <i />
                        <span>
                          <i />
                          <i />
                          <i />
                        </span>
                      </span>
                      <span className="theme-option-label">
                        {t(
                          option === "light"
                            ? "Light"
                            : option === "dark"
                              ? "Dark"
                              : "System",
                        )}
                        <span className="theme-choice-indicator">
                          {theme === option && <Icon name="check" size={12} />}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="settings-auto-save">
                <Icon name="check" size={15} />
                {t("Preferences are saved automatically.")}
              </p>
            </div>
          )}
          <ErrorNote message={error} />
        </section>
      </div>
      <footer className="settings-footer">
        {discard ? (
          <div className="settings-discard" role="alert">
            <span>{t("Discard your unsaved changes?")}</span>
            <button className="button" onClick={() => setDiscard(false)}>
              {t("Keep editing")}
            </button>
            <button className="button danger" onClick={onClose}>
              {t("Discard changes")}
            </button>
          </div>
        ) : (
          <>
            <span className="settings-save-status" role="status">
              {saved && (
                <>
                  <Icon name="check" size={16} />
                  {t(
                    tab === "security"
                      ? "Password updated."
                      : "Profile updated.",
                  )}
                </>
              )}
            </span>
            <button className="button" disabled={busy} onClick={requestClose}>
              {t("Close")}
            </button>
            {tab === "profile" && (
              <button
                className="button primary"
                form={`${id}-profile`}
                disabled={busy || !name.trim() || !dirty}
              >
                {t(busy ? "Saving…" : "Save changes")}
              </button>
            )}
            {tab === "security" && account.data?.hasPassword && (
              <button
                className="button primary"
                form={`${id}-security`}
                disabled={busy || !currentPassword || !newPassword || !confirm}
              >
                {t(busy ? "Saving…" : "Update password")}
              </button>
            )}
          </>
        )}
      </footer>
    </Modal>
  );
}
export function WorkspaceHelp({
  open,
  onClose,
  onTraining,
  onReports,
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  onTraining: () => void;
  onReports: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("How can we help?")}
      returnFocusRef={returnFocusRef}
      className="workspace-help-modal"
    >
      <p className="muted">{t("A few useful places to get started.")}</p>
      <div className="workspace-help-topics">
        <details open>
          <summary>{t("Prepare and reuse training")}</summary>
          <p>
            {t(
              "Upload your material, add activities and practice. After a session ends, use the training again to prepare a fresh session with its own participants and report.",
            )}
          </p>
          <button
            className="text-button"
            onClick={() => {
              onClose();
              onTraining();
            }}
          >
            {t("Open my presentations")}
          </button>
        </details>
        <details>
          <summary>{t("Find a session’s report")}</summary>
          <p>
            {t(
              "Reports are separate for each session. Use the dates and time filters to find the session you are looking for.",
            )}
          </p>
          <button
            className="text-button"
            onClick={() => {
              onClose();
              onReports();
            }}
          >
            {t("View reports")}
          </button>
        </details>
        <details>
          <summary>{t("Folders and Trash")}</summary>
          <p>
            {t(
              "Create folders in My presentations to organize your library. Moving a presentation to Trash keeps its records; restore it whenever you need it.",
            )}
          </p>
        </details>
      </div>
    </Modal>
  );
}
